import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Settings from '@/server/Settings'
import Video from '@/server/stream/Video'
import TranscoderJob from '@/server/stream/TranscoderJob'
import TranscoderCommand from '@/server/stream/TranscoderCommand'
import fs from 'fs'

const loggedVideos: Map<string, { count: number; path: string }> = new Map()

// Generate logs of video events, used for debugging
class VideoEventLogger {
  log(instance: Video | TranscoderJob | TranscoderCommand, event: string) {
    if (!Settings.enableVideoEventLogging) return

    if (!fs.existsSync(Env.VIDEO_LOGGER_OUTPUT_PATH)) {
      fs.mkdirSync(Env.VIDEO_LOGGER_OUTPUT_PATH, { recursive: true })
    }

    let video: Video
    if (instance instanceof Video) video = instance
    else if (instance instanceof TranscoderJob) video = instance.video
    else video = instance.job.video

    // No clue why job is sometimes undefined, ignore it for now
    if (!video.job) return

    const date = new Date()
    const time = date.toTimeString().slice(0, 8).replace(/:/g, '')
    const day = date.toISOString().slice(5, 10)

    if (!loggedVideos.has(video.id)) {
      const file = `${Env.VIDEO_LOGGER_OUTPUT_PATH}/${day} T${time} ${video.id}.txt`
      loggedVideos.set(video.id, { count: 0, path: file })
      const header =
        '----------------------------------------------------------------\n' +
        `Init Time: ${date.toISOString()}\n` +
        `Video ID: ${video.id}\n` +
        `Video Path: ${video.inputPath}\n` +
        `Video Name: ${video.name}\n` +
        `Job ID: ${video.job.id}\n` +
        `Job Init StreamID: ${video.job.streamID}\n` +
        `Job Output Path: ${video.outputPath}\n` +
        '----------------------------------------------------------------\n\n'
      fs.writeFileSync(file, header)
    }

    const existing = loggedVideos.get(video.id)!
    const file = existing.path
    const index = existing.count++
    loggedVideos.set(video.id, existing)

    const instanceName =
      instance instanceof Video ? 'Video' : `${instance.constructor.name}:${video.job.id}`

    // time format: HH:MM:SS.mmm
    const timestamp = `${time}.${date.getMilliseconds().toString().padStart(3, '0')}`

    const log = `${timestamp} | ${index} | V-${video.state} J-${video.job.state} | [${instanceName}] ${event}`
    fs.appendFileSync(file, log + '\n')
    if (Settings.showVideoEventLogsInConsole) Logger.debug(`[VideoEventLogger] - ${log}`)
  }
}

export default new VideoEventLogger()
