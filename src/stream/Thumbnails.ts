import fs from 'fs'
import path from 'path'
import ffmpeg, { THUMBNAIL_ARGS } from '@/lib/ffmpeg'
import Env from '@/EnvVariables'
import type { IncomingMessage, ServerResponse } from 'http'
import type { UrlWithParsedQuery } from 'url'
import Logger from '@/lib/Logger'

export default new class Thumbnails {
  // Generate thumbnail for video if it doesn't exist & return URL
  
async generate(videoPath: string): Promise<string> {
  try {
        // Parse special characters (like %20)
        videoPath = decodeURIComponent(videoPath)

        if (!videoPath.startsWith(Env.VIDEOS_PATH) && !videoPath.startsWith(Env.BUMPERS_PATH)) {
          throw new Error('Video path is not in the videos or bumpers folder.')
        }
    
        const thumbnailPath = path.join(Env.THUMBNAILS_OUTPUT_PATH, `${videoPath.replace(/\//g, '_').replace(/\:/g, '')}.jpg`)
        // const thumbnailPath = path.join(Env.THUMBNAILS_OUTPUT_PATH, `test.jpg`).replace(/\\/g, '/')
        if (fs.existsSync(thumbnailPath)) return thumbnailPath
      // Generate thumbnail with ffmpeg
      if (!fs.existsSync(Env.THUMBNAILS_OUTPUT_PATH)) { // Create folder if it doesn't exist
        fs.mkdirSync(Env.THUMBNAILS_OUTPUT_PATH)
      }

      const command = ffmpeg(videoPath)
      command.outputOptions(THUMBNAIL_ARGS)
      command.output(thumbnailPath)
      console.log(thumbnailPath)
      // commnad arguments
      console.log(command._getArguments())
      await new Promise((resolve, reject) => {
        command.on('end', resolve)
        // command.on('error', reject)
        command.run()
      })
      return thumbnailPath
    }
    catch (error: any) {
      Logger.error('[Thumbnails] Error generating thumbnail:', error)
      return ''
    }
  }

  getURL(videoPath: string): string {
    // const id = videoPath.split('/').pop().split('.').shift()
    // const thumbnailPath = `${Env.THUMBNAIL_PATH}/${id}.jpg`
    return `/thumbnails/${videoPath}`
  }

  // Handle thumbnail requests
  async handleThumbnailRequest(req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery) {
    try {
      const videoPath = parsedUrl.pathname?.replace('/thumbnails/', '')
      if (!videoPath) throw new Error('Could not parse video path from URL')
      const thumbnailPath = await this.generate(videoPath)
      if (!thumbnailPath) throw new Error('No thumbnail path returned')

      const file = fs.createReadStream(thumbnailPath)
      res.setHeader('Content-Type', 'image/png')
      file.pipe(res)
    }
    catch (error: any) {
      Logger.error('[Thumbnails] Error occurred handling thumbnail request:', error)
      res.statusCode = 404
      res.end()
    }
  }
}