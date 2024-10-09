import fs from 'fs'
import path from 'path'
import ffmpeg, { THUMBNAIL_ARGS } from '@/server/lib/ffmpeg'
import Env from '@/server/core/EnvVariables'
import Logger from '@/server/core/Logger'
import Settings from '@/server/core/Settings'
import TranscoderJob from '@/server/stream/TranscoderJob'
import type { IncomingMessage, ServerResponse } from 'http'
import type { UrlWithParsedQuery } from 'url'
import Player from './Player'

// Main thumbnails generator handler, singleton
class Thumbnails {
  private generateCallbacks: Record<string, Array<(thumbnailPath: string | null) => void>> = {}

  // Get client thumbnail URL for video
  getVideoURL(videoPath: string): string {
    return `/thumbnails/${videoPath}`
  }

  // Get client thumbnail URL for playlist
  getPlaylistURL(playlistID: string): string {
    return `/playlist-thumbnails/${playlistID}`
  }

  // Handle thumbnail requests - for videos
  async handleVideoThumbnailRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlWithParsedQuery
  ) {
    try {
      let videoPath = parsedUrl.pathname?.replace('/thumbnails/', '')
      if (!videoPath) throw new Error(`Could not parse video path from URL (${parsedUrl.pathname})`)
      const thumbnailPath = await this.generateVideoThumbnail(videoPath)
      if (!thumbnailPath) throw new Error(`No path returned (${videoPath})`)

      // TODO: Investigate why this throws sometimes, even though we should be generating it right above this line
      if (!fs.existsSync(thumbnailPath)) {
        Logger.warn(`[Thumbnails] File not found: ${thumbnailPath}`)
        res.statusCode = 404
        res.end()
        return
      }

      const file = fs.createReadStream(thumbnailPath)
      res.setHeader('Content-Type', 'image/png')
      file.pipe(res)
    } catch (error: any) {
      res.statusCode = 404
      res.end()
    }
  }

  // Handle thumbnail requests - for playlists
  async handlePlaylistThumbnailRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlWithParsedQuery
  ) {
    try {
      let playlistID = parsedUrl.pathname?.replace('/playlist-thumbnails/', '')
      if (!playlistID)
        throw new Error(`Could not parse playlist ID from URL (${parsedUrl.pathname})`)
      const thumbnailPath = await this.generatePlaylistThumbnail(playlistID)
      if (!thumbnailPath) throw new Error(`No path returned from playlist (${playlistID})`)

      // TODO: Investigate why this throws sometimes, even though we should be generating it right above this line
      if (!fs.existsSync(thumbnailPath)) {
        Logger.warn(`[Thumbnails] File not found: ${thumbnailPath}`)
        res.statusCode = 404
        res.end()
        return
      }

      const file = fs.createReadStream(thumbnailPath)
      res.setHeader('Content-Type', 'image/png')
      file.pipe(res)
    } catch (error: any) {
      res.statusCode = 404
      res.end()
    }
  }

  // Generate thumbnail for video, returns client URL for it, or null if failed
  private async generateVideoThumbnail(videoPath: string): Promise<string | null> {
    videoPath = decodeURIComponent(videoPath) // Parse special characters (like %20)

    if (!videoPath.startsWith(Env.VIDEOS_PATH) && !videoPath.startsWith(Env.BUMPERS_PATH)) {
      Logger.error('[Thumbnails] Video path is not in the videos or bumpers folder.', videoPath)
      return null
    }

    if (!fs.existsSync(videoPath)) {
      Logger.warn(`[Thumbnails] Video file does not exist, ignoring. (${videoPath})`)
      return null
    }

    const thumbnailPath = path.join(
      Env.THUMBNAILS_OUTPUT_PATH,
      `${videoPath.replace(/\//g, '_').replace(/\:/g, '')}.jpg`
    )

    if (fs.existsSync(thumbnailPath)) return thumbnailPath

    return new Promise<string | null>(async (resolve) => {
      const callbacks = this.generateCallbacks[thumbnailPath]
      if (callbacks) {
        callbacks.push(resolve)
        return
      }
      this.generateCallbacks[thumbnailPath] = [resolve]

      const startTime = Date.now()

      // Create thumbnail directory if it doesn't exist
      if (!fs.existsSync(Env.THUMBNAILS_OUTPUT_PATH)) {
        fs.mkdirSync(Env.THUMBNAILS_OUTPUT_PATH, { recursive: true })
      }

      const command = ffmpeg(videoPath)
      if (!Settings.enableSmartThumbnails) {
        let seekSeconds = 5
        try {
          seekSeconds = (await TranscoderJob.getVideoDuration(videoPath)) / 2
        } catch (error) {}
        command.inputOptions([`-ss ${seekSeconds}`])
      }
      command.outputOptions(
        Settings.enableSmartThumbnails
          ? ['-vf thumbnail,scale=-1:480', ...THUMBNAIL_ARGS]
          : ['-vf scale=-1:480', ...THUMBNAIL_ARGS]
      )
      command.output(thumbnailPath)

      command.on('end', () => {
        const seconds = ((Date.now() - startTime) / 1000).toFixed(2)
        Logger.debug(`[Thumbnails] Generated thumbnail in ${seconds}s, at: ${thumbnailPath}`)
        this.resolveCallbacks(thumbnailPath, thumbnailPath)
      })

      command.on('error', (error) => {
        Logger.error(`[Thumbnails] Error generating thumbnail: ${thumbnailPath}`, error)
        this.resolveCallbacks(thumbnailPath, null)
      })

      command.run()
    })
  }

  // Generate thumbnail for playlist, returns client URL for it, or null if failed
  private async generatePlaylistThumbnail(playlistID: string): Promise<string | null> {
    playlistID = decodeURIComponent(playlistID) // Parse special characters (like %20)

    const playlist = Player.playlists.find((p) => p.id === playlistID)

    if (!playlist) {
      Logger.error('[Thumbnails] Playlist not found with ID:', playlistID)
      return null
    }

    const thumbnailPath = path.join(Env.THUMBNAILS_OUTPUT_PATH, `playlists/${playlistID}.jpg`)

    if (fs.existsSync(thumbnailPath)) return thumbnailPath

    return new Promise<string | null>(async (resolve) => {
      const callbacks = this.generateCallbacks[thumbnailPath]
      if (callbacks) {
        callbacks.push(resolve)
        return
      }
      this.generateCallbacks[thumbnailPath] = [resolve]

      const startTime = Date.now()

      // Create thumbnail directory if it doesn't exist
      if (!fs.existsSync(path.join(Env.THUMBNAILS_OUTPUT_PATH, 'playlists'))) {
        fs.mkdirSync(path.join(Env.THUMBNAILS_OUTPUT_PATH, 'playlists'), { recursive: true })
      }

      if (playlist.videos.length === 0) {
        Logger.error('[Thumbnails] Playlist has no videos:', playlistID)
        this.resolveCallbacks(thumbnailPath, null)
        return
      }

      if (playlist.videos.length < 4) {
        const result = await this.generateVideoThumbnail(playlist.videos[0])
        this.resolveCallbacks(thumbnailPath, result)
        return
      }

      // Get 4 video paths from the playlist
      const videoPaths: string[] = new Array(4)
      for (let i = 0; i < 4; i++) {
        const index = Math.floor((playlist.videos.length / 4) * i)
        videoPaths[i] = playlist.videos[index]
      }

      let seekSeconds: number[]
      if (!Settings.enableSmartThumbnails) {
        seekSeconds = new Array(4)
        let index = 0
        for await (const videoPath of videoPaths) {
          try {
            seekSeconds[index] = (await TranscoderJob.getVideoDuration(videoPath)) / 2
          } catch (error) {
            seekSeconds[index] = 5
          }
          index++
        }
      }

      // Generate a 2x2 grid of thumbnails
      const command = ffmpeg()

      for (let i = 0; i < 4; i++) {
        command.input(videoPaths[i])
        if (!Settings.enableSmartThumbnails) {
          command.inputOptions([`-ss ${seekSeconds![i]}`])
        }
      }

      const addFilter = Settings.enableSmartThumbnails ? 'thumbnail,' : ''
      command.complexFilter([
        `[0:v]${addFilter}scale=854:480:force_original_aspect_ratio=increase,crop=854:480[v0]`,
        `[1:v]${addFilter}scale=854:480:force_original_aspect_ratio=increase,crop=854:480[v1]`,
        `[2:v]${addFilter}scale=854:480:force_original_aspect_ratio=increase,crop=854:480[v2]`,
        `[3:v]${addFilter}scale=854:480:force_original_aspect_ratio=increase,crop=854:480[v3]`,
        `[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|854_0|0_480|854_480[v]`
      ])

      command.map('[v]') // Map the output of the xstack filter to the output
      command.addOutputOptions(THUMBNAIL_ARGS)
      command.output(thumbnailPath)

      command.on('end', () => {
        const seconds = ((Date.now() - startTime) / 1000).toFixed(2)
        Logger.debug(`[Thumbnails] Generated thumbnail in ${seconds}s, at: ${thumbnailPath}`)
        this.resolveCallbacks(thumbnailPath, thumbnailPath)
      })

      command.on('error', (error) => {
        Logger.error(`[Thumbnails] Error generating thumbnail: ${thumbnailPath}`, error)
        this.resolveCallbacks(thumbnailPath, null)
      })

      command.run()
    })
  }

  private resolveCallbacks(thumbnailPath: string, path: string | null) {
    const callbacks = this.generateCallbacks[thumbnailPath]
    if (!callbacks) return
    for (const callback of callbacks) callback(path)
    delete this.generateCallbacks[thumbnailPath]
  }
}

export default new Thumbnails()
