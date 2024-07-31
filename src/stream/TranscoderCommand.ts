import path from 'path'
import ffmpeg, { TRANSCODE_ARGS } from '@/lib/ffmpeg'
import type TransCoderJob from '@/stream/TranscoderJob'
import type { FfmpegCommand } from 'fluent-ffmpeg'

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

  onProgress(callback: (progress: any) => void) {
    this.ffmpegCommand.on('progress', callback)
  }
}
