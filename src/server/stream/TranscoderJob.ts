import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import generateSecret from '@/lib/generateSecret'
import ffmpeg from '@/lib/ffmpeg'
import Logger from '@/server/Logger'
import Settings from '@/server/Settings'
import Player from '@/server/stream/Player'
import TranscoderCommand from '@/server/stream/TranscoderCommand'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import SocketUtils from '@/server/socket/SocketUtils'
import { JobState, Msg } from '@/lib/enums'
import type { ProgressInfo } from '@/typings/types'
import type Video from '@/server/stream/Video'
import rmDirRetry from '@/lib/rmDirRetry'
import parseHlsManifest from '@/lib/parseHlsManifest'

// Represents a transcoding job
export default class TranscoderJob {
  readonly id: string = generateSecret()
  streamID: string = generateSecret()
  videos: Video[] = []
  readonly m3u8Path: string
  isStreamableReady: boolean = false
  duration: number = 0
  error?: string
  lastProgressInfo?: ProgressInfo
  transcodedStartSeconds: number = 0

  private command: TranscoderCommand
  private onInitializedCallback?: () => void
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onTranscodeFinishedCallback?: () => void
  private onErrorCallbacks: Array<(error: string) => void> = []
  private cleanUpCallback?: () => void

  private _state: JobState = JobState.Initializing
  get state() {
    return this._state
  }
  private set state(value: JobState) {
    if (this._state === value) return
    this._state = value
    SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
  }

  constructor(public video: Video) {
    this.videos.push(this.video)
    this.m3u8Path = path.join(this.video.outputPath, '/video.m3u8')
    this.command = new TranscoderCommand(this)
    this.initialize()
  }

  async initialize() {
    this.state = JobState.Initializing

    this.command.onEnd(async () => {
      if (this.error) return

      if (this.state === JobState.Finished) {
        // Was killed due to no more videos remaining
        // await this.cleanup()
        console.log('job debug 1'.bgBlue, this)
        return
      }

      Logger.debug('[TranscoderJob] Transcoding finished:', this.video.outputPath, this)
      // this.state = 'finished'

      if (!this.isStreamableReady) {
        this.isStreamableReady = true
        this.resolveStreamableReadyCallbacks()
      }
      this.resolveTranscodeFinishedCallbacks()
      Player.broadcastStreamInfo()

      // try {
      //   await this.checkIfComplete()
      // } catch (error: any) {
      //   Logger.error('[Video] E03 Transcoding error:', error)
      //   this.throwError(error.message)
      // }
    })

    this.command.onError(async (error) => {
      Logger.error(`[Video] Transcoding error ${this.video.name}:`, error)
      this.throwError('Transcoding error occurred. :(')
    })

    this.command.onProgress((progress) => {
      this.lastProgressInfo = progress
      SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, Player.adminStreamInfo)
      SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    })

    // When first segment is created
    this.command.onFirstChunk(async () => {
      // if (this.isStreamableReady) return
      this.isStreamableReady = true
      this.resolveStreamableReadyCallbacks()
      Player.broadcastStreamInfo()
    })

    // Get the duration of the video
    try {
      this.duration = await TranscoderJob.getVideoDuration(this.video.inputPath)
    } catch (error: any) {
      // If we can't get the duration, it's a hard fail
      Logger.error('[TranscoderJob] Transcoding error:', error)
      this.throwError(error.message)
      return
    }

    // Check if partial/incomplete transcoded files exist & delete them if so
    // If total duration in existing m3u8 file is not within 1s of the video duration, it's partial
    try {
      const isFullCache = await this.checkIfCacheComplete()
      if (!isFullCache) {
        Logger.warn('[TranscoderJob] Partial files found, deleting cache:', this.video.outputPath)
        await fsAsync.rm(this.video.outputPath, { recursive: true, force: true })
      }
    } catch (error: any) {
      Logger.error('[TranscoderJob] Transcoding error:', error)
      this.throwError(error.message)
      return
    }

    try {
      await this.checkIfComplete()
      this.resolveInitializedCallback()
    } catch (_) {
      this.state = JobState.Idle
      this.resolveInitializedCallback()
    }
  }

  // Add this job to the queue
  activate() {
    if (this.state === JobState.Errored) {
      this.resolveErrorCallbacks()
      return
    }

    if (this.isStreamableReady) {
      this.resolveStreamableReadyCallbacks()
      this.resolveTranscodeFinishedCallbacks()
      return
    }

    if (this.state === JobState.Idle) {
      this.state = JobState.AwaitingTranscode
      TranscoderQueue.processQueue()
      return
    }

    if (this.state === JobState.Initializing) {
      this.onInitializedCallback = () => this.activate()
    }

    if (this.state === JobState.CleaningUp) {
      this.cleanUpCallback = () => this.activate()
    }
  }

  // Actually start the transcoding process
  // Should only be called once - (TODO ADJUSTING)
  async transcode(): Promise<void> {
    this.state = JobState.Transcoding

    return new Promise<void>((resolve: any) => {
      this.onTranscodeFinishedCallback = resolve
      this.onError(resolve)

      fs.mkdirSync(this.video.outputPath, { recursive: true })
      this.command.run()
    })
  }

  async unlink(video: Video) {
    const index = this.videos.findIndex((item) => item === video)
    if (index !== -1) this.videos.splice(index, 1)
    await this.cleanup()
  }

  // Clean up job and stop transcoding if it's still running
  // This should be called when video has finished playing, or when it's removed from the queue
  async cleanup() {
    if (this.videos.length > 0) {
      // Don't cleanup if there are still videos in the queue
      // But if the current transcoded video is partial, we need to delete it and seek to 0
      if (this.transcodedStartSeconds === 0) return
      await this.seekTranscodeTo(0)
      return
    }

    if (this.state === JobState.Transcoding) {
      this.state = JobState.CleaningUp
      this.command.TEMPforceKill()
    }

    this.state = JobState.CleaningUp
    this.isStreamableReady = false

    const keepCache = this.video.isBumper ? Settings.cacheBumpers : Settings.cacheVideos

    if (!keepCache) {
      try {
        await rmDirRetry(this.video.outputPath)
      } catch (error) {
        Logger.error(`[Video] Error deleting video cache: ${this.video.outputPath}`)
      }
    }

    if (this.videos.length > 0) {
      this.initialize()
      this.cleanUpCallback?.()
      return
    }

    // Remove job from queue
    const index = TranscoderQueue.jobs.findIndex((item) => item === this)
    if (index !== -1) TranscoderQueue.jobs.splice(index, 1)

    this.initialize()
  }

  // Restart the transcoding process from specified time
  // This can also be used to update ffmpeg options on the fly
  async seekTranscodeTo(seconds: number) {
    this.transcodedStartSeconds = seconds
    if (this.state !== JobState.Transcoding && this.state !== JobState.Finished) return
    this.state = JobState.Transcoding
    this.isStreamableReady = false
    this.command.kill()
    try {
      await rmDirRetry(this.video.outputPath)
      this.streamID = generateSecret()
      Player.broadcastStreamInfo()
      await this.transcode()
      Player.broadcastStreamInfo()
    } catch (error: any) {
      Logger.error('[TranscoderJob] Error seeking transcoded video:', error)
      this.throwError(error.message)
    }
  }

  // Called when the video has been transcoded enough to start playing while the rest is still transcoding
  onStreamableReady(callback: () => void) {
    if (this.isStreamableReady) return callback()
    this.onStreamableReadyCallbacks.push(callback)
  }

  // Called if an error occurs during transcoding, no other callbacks will be called
  onError(callback: (error: string) => void) {
    if (this.state === JobState.Errored && this.error) return callback(this.error)
    this.onErrorCallbacks.push(callback)
  }

  private resolveInitializedCallback() {
    this.onInitializedCallback?.()
    delete this.onInitializedCallback
  }

  private resolveStreamableReadyCallbacks() {
    for (const callback of this.onStreamableReadyCallbacks) callback()
    // this.onStreamableReadyCallbacks = []
  }

  private resolveTranscodeFinishedCallbacks() {
    this.onTranscodeFinishedCallback?.()
    delete this.onTranscodeFinishedCallback
  }

  private resolveErrorCallbacks() {
    for (const callback of this.onErrorCallbacks) callback(this.error as string)
    this.onErrorCallbacks = []
  }

  private throwError(error: string) {
    this.error = error
    this.state = JobState.Errored
    this.resolveErrorCallbacks()
  }

  // Check if transcoding is complete
  private async checkIfComplete() {
    if (this.state === JobState.Finished) return

    if (!fs.existsSync(this.m3u8Path)) throw new Error('Transcoded files do not exist.')

    this.state = JobState.Finished
    this.isStreamableReady = true
    this.resolveStreamableReadyCallbacks()
    this.resolveTranscodeFinishedCallbacks()
  }

  // See if existing transcoded files are full or partial
  private async checkIfCacheComplete(): Promise<boolean> {
    if (!fs.existsSync(this.m3u8Path)) return false
    const manifestText = await fsAsync.readFile(this.m3u8Path, 'utf8')
    const manifest = parseHlsManifest(manifestText)
    if (!manifest || !manifest.isEnded) return false
    const diff = Math.abs(manifest.seconds - this.duration)
    return diff < 1
  }

  // Use ffprobe to get the duration of the video if it hasn't been set yet
  // This also acts as a check to see if input is a valid video file
  static async getVideoDuration(inputPath: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (error, metadata) => {
        if (error) reject('Failed to get video duration.')
        const duration = metadata?.format?.duration
        if (typeof duration !== 'number') {
          reject('Failed to get video metadata duration value.')
          return
        }
        resolve(duration)
      })
    })
  }

  get availableSeconds(): number {
    if (this.state === JobState.Finished) return this.duration
    if (!this.lastProgressInfo) return 0
    return this.lastProgressInfo.availableSeconds + this.transcodedStartSeconds
  }
}
