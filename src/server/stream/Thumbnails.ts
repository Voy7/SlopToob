import fs from 'fs'
import path from 'path'
import ffmpeg, { THUMBNAIL_ARGS } from '@/server/lib/ffmpeg'
import Env from '@/server/core/EnvVariables'
import Logger from '@/server/core/Logger'
import TranscoderJob from '@/server/stream/TranscoderJob'
import type { IncomingMessage, ServerResponse } from 'http'
import type { UrlWithParsedQuery } from 'url'
import Settings from '../core/Settings'

export default new (class Thumbnails {
  private generateCallbacks: Record<string, Array<(thumbnailPath: string | null) => void>> = {}

  // Generate thumbnail for video if it doesn't exist & return URL
  async generate(videoPath: string): Promise<string | null> {
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

      let seekSeconds = 5
      try {
        seekSeconds = (await TranscoderJob.getVideoDuration(videoPath)) / 2
      } catch (error) {}

      const command = ffmpeg(videoPath)
      // command.inputOptions([`-ss ${seekSeconds}`])
      if (!Settings.enableSmartThumbnails) command.inputOptions([`-ss ${seekSeconds}`])
      command.outputOptions(
        Settings.enableSmartThumbnails
          ? ['-vf thumbnail,scale=-1:480', ...THUMBNAIL_ARGS]
          : ['-vf scale=-1:480', ...THUMBNAIL_ARGS]
      )
      command.output(thumbnailPath)

      command.on('end', () => {
        const seconds = ((Date.now() - startTime) / 1000).toFixed(2)
        Logger.debug(`[Thumbnails] Generated thumbnail in ${seconds}s, at: ${thumbnailPath}`)
        const callbacks = this.generateCallbacks[thumbnailPath]
        if (!callbacks) return
        for (const callback of callbacks) callback(thumbnailPath)
        delete this.generateCallbacks[thumbnailPath]
      })

      command.on('error', (error) => {
        Logger.error(`[Thumbnails] Error generating thumbnail: ${thumbnailPath}`, error)
        const callbacks = this.generateCallbacks[thumbnailPath]
        if (!callbacks) return
        for (const callback of callbacks) callback(null)
        delete this.generateCallbacks[thumbnailPath]
      })

      command.run()
    })
  }

  // Get client thumbnail URL for video
  getURL(videoPath: string): string {
    return `/thumbnails/${videoPath}`
  }

  // Handle thumbnail requests
  async handleThumbnailRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlWithParsedQuery
  ) {
    try {
      let videoPath = parsedUrl.pathname?.replace('/thumbnails/', '')
      if (!videoPath) throw new Error(`Could not parse video path from URL (${parsedUrl.pathname})`)
      const thumbnailPath = await this.generate(videoPath)
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
})()
