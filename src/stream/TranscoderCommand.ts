import fs from 'fs'
import path from 'path'
import ffmpeg, { TRANSCODE_ARGS } from '@/lib/ffmpeg'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { ProgressInfo } from '@/typings/types'
import type TransCoderJob from '@/stream/TranscoderJob'
import timestampToSeconds from '@/lib/timestampToSeconds'

export default class TranscoderCommand {
  readonly job: TransCoderJob
  private ffmpegCommand: FfmpegCommand

  constructor(job: TransCoderJob) {
    this.job = job
    this.ffmpegCommand = ffmpeg(job.video.inputPath).addOptions(TRANSCODE_ARGS)
    this.ffmpegCommand.output(path.join(job.video.outputPath, '/video.m3u8'))
  }

  run() {
    this.ffmpegCommand.run()
  }

  kill() {
    this.ffmpegCommand.kill('SIGKILL')
  }

  onEnd(callback: () => void) {
    this.ffmpegCommand.on('end', callback)
  }

  onError(callback: (err: Error) => void) {
    this.ffmpegCommand.on('error', callback)
  }

  // Output progress info every second
  onProgress(callback: (progress: ProgressInfo) => void) {
    this.ffmpegCommand.on('progress', (progress) => {
      progress.timemark = progress.timemark?.split('.')[0] || '00:00:00'
      callback({
        percent: progress.percent || 0,
        availableSeconds: timestampToSeconds(progress.timemark),
        availableTimestamp: progress.timemark,
        fpsRate: progress.currentFps || 0,
        frames: progress.frames || 0
      })
    })
  }

  onFirstChunk(callback: () => void) {
    const checker = () => {
      if (!fs.existsSync(this.job.m3u8Path)) return
      this.ffmpegCommand.removeListener('progress', checker)
      callback()
    }
    this.ffmpegCommand.on('progress', checker)
  }
}
