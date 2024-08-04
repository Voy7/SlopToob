import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg, { TRANSCODE_ARGS } from '@/lib/ffmpeg'
import parseTimestamp from '@/lib/parseTimestamp'
import timestampToSeconds from '@/lib/timestampToSeconds'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { ProgressInfo } from '@/typings/types'
import type TransCoderJob from '@/stream/TranscoderJob'

export default class TranscoderCommand {
  readonly job: TransCoderJob
  private ffmpegCommand?: FfmpegCommand
  private onEndCallback?: () => void
  private onErrorCallback?: (err: Error) => void
  private onProgressCallback?: (progress: ProgressInfo) => void
  private onFirstChunkCallback?: () => void

  constructor(job: TransCoderJob) {
    this.job = job
  }

  // Construct and run ffmpeg command, with seek time
  run() {
    this.ffmpegCommand = ffmpeg(this.job.video.inputPath).addOptions(TRANSCODE_ARGS)
    this.ffmpegCommand.inputOptions([`-ss ${this.job.transcodedStartSeconds}`])
    this.ffmpegCommand.output(path.join(this.job.m3u8Path))

    this.ffmpegCommand.on('end', () => {
      this.onEndCallback?.()
    })

    this.ffmpegCommand.on('error', (error) => {
      this.onErrorCallback?.(error)
    })

    let availableSeconds = 0

    fs.watchFile(this.job.m3u8Path, { interval: 1000 }, async () => {
      try {
        // Read m3u8 file to get available seconds (add all #EXTINF: values)
        const text = await fsAsync.readFile(this.job.m3u8Path, 'utf8')
        // Line structure: #EXTINF:10.000,
        const matches = text.match(/#EXTINF:(\d+\.\d+),/g)
        availableSeconds =
          matches?.reduce((acc, val) => acc + parseFloat(val.split(':')[1]), 0) || 0
      } catch {}
    })

    // Output progress info every second
    this.ffmpegCommand.on('progress', (progress) => {
      progress.timemark = progress.timemark?.split('.')[0] || '00:00:00'
      this.onProgressCallback?.({
        percent:
          ((availableSeconds + this.job.transcodedStartSeconds) / this.job.video.durationSeconds) *
          100,
        processedSeconds: timestampToSeconds(progress.timemark) || 0,
        processedTimestamp: progress.timemark,
        availableSeconds: availableSeconds,
        availableTimestamp: parseTimestamp(availableSeconds),
        fpsRate: progress.currentFps || 0,
        frames: progress.frames || 0
      })
    })

    // Listen for first chunk of video is ready
    const firstChunkChecker = () => {
      if (!fs.existsSync(this.job.m3u8Path)) return
      this.ffmpegCommand?.removeListener('progress', firstChunkChecker)
      this.onFirstChunkCallback?.()
    }
    this.ffmpegCommand.on('progress', firstChunkChecker)

    // Actually run the command
    this.ffmpegCommand.run()
  }

  kill() {
    this.ffmpegCommand?.removeAllListeners()
    this.ffmpegCommand?.on('error', () => {}) // Prevent error from being thrown
    this.ffmpegCommand?.kill('SIGKILL')
    // this.onEndCallback?.()
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback
  }

  onError(callback: (err: Error) => void) {
    this.onErrorCallback = callback
  }

  // Output progress info every second
  onProgress(callback: (progress: ProgressInfo) => void) {
    this.onProgressCallback = callback
  }

  onFirstChunk(callback: () => void) {
    this.onFirstChunkCallback = callback
  }
}
