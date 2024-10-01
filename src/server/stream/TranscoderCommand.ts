import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg, { BASE_TRANSCODE_ARGS, VIDEO_QUALITY_ARGS, AUDIO_QUALITY_ARGS } from '@/lib/ffmpeg'
import { videoQualities } from '@/lib/videoQualities'
import { audioQualities } from '@/lib/audioQualities'
import parseHlsManifest from '@/lib/parseHlsManifest'
import timestampToSeconds from '@/lib/timestampToSeconds'
import Settings from '@/server/Settings'
import EventLogger from '@/server/stream/VideoEventLogger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { ProgressInfo } from '@/typings/types'
import type TransCoderJob from '@/server/stream/TranscoderJob'

export default class TranscoderCommand {
  readonly job: TransCoderJob
  private ffmpegCommand?: FfmpegCommand
  private onEndCallback?: () => void
  private onErrorCallback?: (err: Error) => void
  private onFirstChunkCallback?: () => void
  private onProgressCallback?: (progress: ProgressInfo) => void

  constructor(job: TransCoderJob) {
    this.job = job
  }

  // Construct and run ffmpeg command, with seek time
  async run() {
    EventLogger.log(this, `Initializing command`)

    const fpsRates: number[] = []

    try {
      fs.mkdirSync(this.job.video.outputPath, { recursive: true })
    } catch (error: any) {
      this.onErrorCallback?.(error)
      return
    }
    EventLogger.log(this, `Initializing command 2`)

    this.ffmpegCommand = ffmpeg(this.job.video.inputPath)
    this.ffmpegCommand.addInputOptions([`-ss ${this.job.transcodedStartSeconds}`])
    this.ffmpegCommand.addOutputOptions(BASE_TRANSCODE_ARGS)

    const videoQualityNodeID = videoQualities[Settings.maxVideoQuality]?.id
    if (videoQualityNodeID) {
      const ffmpegVideoQualityArgs = VIDEO_QUALITY_ARGS[videoQualityNodeID]
      if (ffmpegVideoQualityArgs) this.ffmpegCommand.addOutputOptions(ffmpegVideoQualityArgs)
    }

    const audioQualityNodeID = audioQualities[Settings.maxAudioQuality]?.id
    if (audioQualityNodeID) {
      const ffmpegAudioQualityArgs = AUDIO_QUALITY_ARGS[audioQualityNodeID]
      if (ffmpegAudioQualityArgs) this.ffmpegCommand.addOutputOptions(ffmpegAudioQualityArgs)
    }

    if (Settings.enableVolumeNormalization) {
      const I = Settings.loudnormTargetIntegrated
      const TP = Settings.loudnormTargetPeak
      const LRA = Settings.loudnormRange
      this.ffmpegCommand.addOutputOptions([`-filter:a loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`])
    }

    this.ffmpegCommand.output(path.join(this.job.m3u8Path))

    let firstChunkReady = false
    let availableSeconds = 0

    this.ffmpegCommand.on('end', () => {
      if (!firstChunkReady) {
        firstChunkReady = true
        this.onFirstChunkCallback?.()
      }
      this.onEndCallback?.()
    })

    this.ffmpegCommand.on('error', (error) => {
      this.onErrorCallback?.(error)
    })

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
      if (progress.currentFps) {
        fpsRates.push(progress.currentFps)
        if (fpsRates.length > 100) fpsRates.shift()
      }
      this.onProgressCallback?.({
        percent:
          ((availableSeconds + this.job.transcodedStartSeconds) / this.job.video.durationSeconds) *
          100,
        processedSeconds: timestampToSeconds(progress.timemark) || 0,
        processedTimestamp: progress.timemark,
        availableSeconds: availableSeconds,
        averageFpsRate: Math.round(fpsRates.reduce((a, b) => a + b, 0) / fpsRates.length),
        currentFpsRate: progress.currentFps || 0,
        frames: progress.frames || 0
      })
    })

    // Actually run the command
    EventLogger.log(this, `Running command`)
    this.ffmpegCommand.run()
  }

  kill() {
    fs.unwatchFile(this.job.m3u8Path)
    this.ffmpegCommand?.removeAllListeners()
    this.ffmpegCommand?.on('error', () => {}) // Prevent error from being thrown
    this.ffmpegCommand?.kill('SIGKILL')
  }

  forceKill() {
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
