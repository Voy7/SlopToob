import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg, { TRANSCODE_ARGS } from '@/lib/ffmpeg'
import parseHlsManifest from '@/lib/parseHlsManifest'
import parseTimestamp from '@/lib/parseTimestamp'
import timestampToSeconds from '@/lib/timestampToSeconds'
import Logger from '@/server/Logger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { ProgressInfo } from '@/typings/types'
import type TransCoderJob from '@/server/stream/TranscoderJob'

export default class TranscoderCommand {
  private readonly job: TransCoderJob
  private ffmpegCommand?: FfmpegCommand
  private onEndCallback?: () => void
  private onErrorCallback?: (err: Error) => void
  private onFirstChunkCallback?: () => void
  private onProgressCallback?: (progress: ProgressInfo) => void

  constructor(job: TransCoderJob) {
    this.job = job
  }

  // Construct and run ffmpeg command, with seek time
  run() {
    this.ffmpegCommand = ffmpeg(this.job.video.inputPath).addOptions(TRANSCODE_ARGS)
    this.ffmpegCommand.inputOptions([`-ss ${this.job.transcodedStartSeconds}`])
    this.ffmpegCommand.output(path.join(this.job.m3u8Path))

    this.ffmpegCommand.on('end', () => {
      console.log(`Transcoder end: ${this.job.video.name}`.green)
      this.onEndCallback?.()
    })

    this.ffmpegCommand.on('error', (error) => {
      console.log(`Transcoder error: ${this.job.video.name}`.bgRed)
      this.onErrorCallback?.(error)
    })

    let availableSeconds = 0
    let firstChunkReady = false

    fs.watchFile(this.job.m3u8Path, { interval: 1000 }, async () => {
      try {
        // Read m3u8 file to get available seconds
        const text = await fsAsync.readFile(this.job.m3u8Path, 'utf8')
        const manifestData = parseHlsManifest(text)
        if (!manifestData) return
        if (!firstChunkReady) {
          firstChunkReady = true
          this.onFirstChunkCallback?.()
        }
        availableSeconds = manifestData.seconds
        if (manifestData.isEnded) {
          fs.unwatchFile(this.job.m3u8Path)
        }
      } catch (error) {}
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

    // Actually run the command
    this.ffmpegCommand.run()
  }

  kill() {
    fs.unwatchFile(this.job.m3u8Path)
    this.ffmpegCommand?.removeAllListeners()
    this.ffmpegCommand?.on('error', () => {}) // Prevent error from being thrown
    this.ffmpegCommand?.kill('SIGKILL')
  }

  TEMPforceKill() {
    fs.unwatchFile(this.job.m3u8Path)
    this.ffmpegCommand?.kill('SIGKILL')
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback
  }

  onError(callback: (err: Error) => void) {
    this.onErrorCallback = callback
  }

  onFirstChunk(callback: () => void) {
    this.onFirstChunkCallback = callback
  }

  onProgress(callback: (progress: ProgressInfo) => void) {
    this.onProgressCallback = callback
  }
}
