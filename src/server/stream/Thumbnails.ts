import fs from 'fs'
import path from 'path'
import ffmpeg, { THUMBNAIL_ARGS } from '@/lib/ffmpeg'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import TranscoderJob from '@/server/stream/TranscoderJob'
import type { IncomingMessage, ServerResponse } from 'http'
import type { UrlWithParsedQuery } from 'url'

export default new (class Thumbnails {
  private generateCallbacks: Record<string, Array<(thumbnailPath: string | null) => void>> = {}

  // Generate thumbnail for video if it doesn't exist & return URL
  async generate(videoPath: string): Promise<string | null> {
    videoPath = decodeURIComponent(videoPath) // Parse special characters (like %20)

    if (!videoPath.startsWith(Env.VIDEOS_PATH) && !videoPath.startsWith(Env.BUMPERS_PATH)) {
      Logger.error('Video path is not in the videos or bumpers folder.')
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

      // Create thumbnail directory if it doesn't exist
      if (!fs.existsSync(Env.THUMBNAILS_OUTPUT_PATH)) {
        fs.mkdirSync(Env.THUMBNAILS_OUTPUT_PATH, { recursive: true })
      }

      let seekSeconds = 5
      try {
        seekSeconds = (await TranscoderJob.getVideoDuration(videoPath)) / 2
      } catch (error: any) {}

      const command = ffmpeg(videoPath)
      command.outputOptions([...THUMBNAIL_ARGS, `-ss ${seekSeconds}`])
      command.output(thumbnailPath)

      command.on('end', () => {
        Logger.debug(`[Thumbnails] Generated thumbnail at: ${thumbnailPath}`)
        const callbacks = this.generateCallbacks[thumbnailPath]
        if (!callbacks) return
        for (const callback of callbacks) callback(thumbnailPath)
        delete this.generateCallbacks[thumbnailPath]
      })

      command.on('error', (error) => {
        Logger.error('[Thumbnails] Error generating thumbnail:', error)
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
      const videoPath = parsedUrl.pathname?.replace('/thumbnails/', '')
      if (!videoPath) throw new Error('Could not parse video path from URL')
      const thumbnailPath = await this.generate(videoPath)
      if (!thumbnailPath) throw new Error(`No thumbnail path returned: ${videoPath}`)

      // TODO: Investigate why this throws sometimes, even though we should be generating it right above this line
      if (!fs.existsSync(thumbnailPath)) {
        // throw new Error(`Thumbnail file not found: ${thumbnailPath}`)
        Logger.warn(`Thumbnail file not found: ${thumbnailPath}`)
        res.statusCode = 404
        res.end()
        return
      }

      const file = fs.createReadStream(thumbnailPath)
      res.setHeader('Content-Type', 'image/png')
      file.pipe(res)
    } catch (error: any) {
      Logger.error('[Thumbnails] Error occurred handling thumbnail request:', error)
      res.statusCode = 404
      res.end()
    }
  }
})()
