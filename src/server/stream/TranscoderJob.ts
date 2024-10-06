import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg from '@/lib/ffmpeg'
import generateSecret from '@/lib/generateSecret'
import parseHlsManifest from '@/lib/parseHlsManifest'
import rmDirRetry from '@/lib/rmDirRetry'
import Logger from '@/server/Logger'
import Settings from '@/server/Settings'
import Player from '@/server/stream/Player'
import TranscoderCommand from '@/server/stream/TranscoderCommand'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import SocketUtils from '@/server/socket/SocketUtils'
import EventLogger from '@/server/stream/VideoEventLogger'
import { JobState, Msg } from '@/lib/enums'
import type { ProgressInfo } from '@/typings/types'
import type Video from '@/server/stream/Video'

// Represents a transcoding job, which can have multiple Video instances using it
export default class TranscoderJob {
  readonly id: string = generateSecret()
  streamID: string = generateSecret()
  videos: Video[] = []
  readonly m3u8Path: string
  isStreamableReady: boolean = false
  isUsingCache: boolean = false
  duration: number = 0
  error?: string
  lastProgressInfo?: ProgressInfo
  transcodedStartSeconds: number = 0

  private command: TranscoderCommand
  private onInitializedCallback?: () => void
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onSeekingCallbacks: Array<() => void> = []
  private onProgressCallbacks: Array<(progress: ProgressInfo) => void> = []
  private onTranscodeFinishedCallback?: () => void
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
    this.m3u8Path = path.join(this.video.outputPath, '/video.m3u8').replace(/\\/g, '/')
    this.command = new TranscoderCommand(this)

    this.command.onEnd(async () => {
      EventLogger.log(this, `Command callback - onEnd()`)

      if (this.error) return

      Logger.debug('[TranscoderJob] Transcoding finished:', this.m3u8Path)
      this.state = JobState.Finished

      if (!this.isStreamableReady) {
        this.isStreamableReady = true
        this.resolveStreamableReadyCallbacks()
      }
      this.resolveTranscodeFinishedCallback()
    })

    this.command.onError(async (error) => {
      EventLogger.log(this, `Command callback - onError(${error})`)

      Logger.error(`[TranscoderJob] Transcoding error ${this.video.name}:`, error)
      this.throwError('Transcoding error occurred. :(')
    })

    this.command.onProgress((progress) => {
      EventLogger.log(this, `Command callback - onProgress(${progress})`)

      this.lastProgressInfo = progress
      this.resolveProgressCallbacks(progress)
      SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, Player.adminStreamInfo)
      SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    })

    // When first segment is created
    this.command.onFirstChunk(async () => {
      EventLogger.log(this, `Command callback - onFirstChunk()`)

      this.isStreamableReady = true
      this.resolveStreamableReadyCallbacks()
    })

    this.initialize()
  }

  // Initialize the job, check if transcoded files exist and are complete
  // Can be called multiple times, typically when 2+ videos are on this job and previous one finishes
  async initialize(forceDeleteCache: boolean = false) {
    EventLogger.log(this, `initialize()`)

    this.state = JobState.Initializing

    this.isStreamableReady = false
    this.isUsingCache = false

    if (!fs.existsSync(this.video.inputPath)) {
      this.throwError(`Video file does not exist. (${this.video.inputPath})`)
      return
    }

    // Get the duration of the video if it hasn't been set yet
    if (!this.duration) {
      try {
        this.duration = await TranscoderJob.getVideoDuration(this.video.inputPath)
      } catch (error: any) {
        Logger.error('[TranscoderJob] Transcoding error:', error)
        this.throwError(error)
        return
      }
    }

    // There are no transcoded files yet, no need to clean up cache
    if (!fs.existsSync(this.m3u8Path)) {
      this.state = JobState.Idle
      this.resolveInitializedCallback()
      return
    }

    // Check if partial/incomplete transcoded files exist & delete them if so
    // If total duration in existing m3u8 file is not within 1s of the video duration, it's partial
    try {
      const isFullCache = forceDeleteCache ? false : await this.checkIfCacheComplete()
      if (isFullCache) {
        this.state = JobState.Finished
        this.isStreamableReady = true
        this.isUsingCache = true
        this.resolveStreamableReadyCallbacks()
        this.resolveTranscodeFinishedCallback()
        SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
        return
      }

      Logger.warn('[TranscoderJob] Partial files found, deleting cache:', this.video.outputPath)
      await fsAsync.rm(this.video.outputPath, { recursive: true, force: true })
      this.state = JobState.Idle
      this.resolveInitializedCallback()
      return
    } catch (error: any) {
      Logger.error('[TranscoderJob] Transcoding error:', error)
      this.throwError(error.message)
    }
  }

  // Add this job to the queue
  activate() {
    EventLogger.log(this, `activate()`)

    if (this.error) return

    if (this.state === JobState.Idle) {
      this.state = JobState.AwaitingTranscode
      TranscoderQueue.processQueue()
      return
    }

    if (this.state === JobState.Initializing) {
      this.onInitializedCallback = () => this.activate()
    }

    if (this.state === JobState.CleaningUp) {
      this.onInitializedCallback = () => this.activate()
    }
  }

  // Resolves when transcoding is complete, or immediately if it's already done
  // This is seperate from the transcoding being restarted for seeking, etc. It's for TranscoderQueue to know when it's done
  async transcode(): Promise<void> {
    EventLogger.log(this, `transcode()`)

    if (this.error) return
    this.state = JobState.Transcoding

    return new Promise<void>((resolve: any) => {
      this.onTranscodeFinishedCallback = resolve
      this.onError(resolve)
      this.command.run()
    })
  }

  // Remove video from job, and clean up if no other videos are using this job
  async unlink(video: Video) {
    EventLogger.log(this, `unlink(${video.name})`)

    const index = this.videos.findIndex((item) => item === video)
    if (index !== -1) this.videos.splice(index, 1)
    await this.cleanup()
  }

  // Clean up job and stop transcoding if it's still running
  // This should be called when video has finished playing, or when it's removed from the queue
  async cleanup() {
    EventLogger.log(this, `cleanup()`)

    if (this.videos.length > 0) {
      // Don't cleanup if there are still videos in the queue
      // But if the current transcoded video is partial, we need to delete it and seek to 0
      if (this.transcodedStartSeconds === 0) return
      await this.seekTranscodeTo(0)
      return
    }

    this.isStreamableReady = false
    if (this.state === JobState.Transcoding) {
      this.state = JobState.CleaningUp
      this.command.kill()
    }
    this.state = JobState.CleaningUp

    const keepCache = this.video.isBumper ? Settings.cacheBumpers : Settings.cacheVideos
    if (!keepCache || this.transcodedStartSeconds > 0) {
      try {
        await rmDirRetry(this.video.outputPath)
      } catch (error) {
        Logger.error(`[TranscoderJob] Error deleting video cache: ${this.video.outputPath}`)
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
    SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
  }

  // Restart the transcoding process from specified time
  // This can also be used to update ffmpeg options on the fly
  async seekTranscodeTo(seconds: number) {
    EventLogger.log(this, `seekTranscodeTo(${seconds})`)

    this.transcodedStartSeconds = seconds
    if (this.state !== JobState.Transcoding && this.state !== JobState.Finished) return
    this.state = JobState.Transcoding
    this.isStreamableReady = false
    this.isUsingCache = false
    this.resolveSeekingCallbacks()
    this.command.kill()
    try {
      await rmDirRetry(this.video.outputPath)
      this.streamID = generateSecret()
      this.command.run()
    } catch (error: any) {
      Logger.error('[TranscoderJob] Error seeking transcoded video:', error)
      this.throwError(error.message)
    }
  }

  // Reset transcoding process, used for applying new transcoding settings
  async resetTranscode() {
    EventLogger.log(this, `resetTranscode()`)

    if (Player.playing?.job === this) {
      this.seekTranscodeTo(Player.playing.currentSeconds)
      return
    }
    if (this.state !== JobState.Transcoding && this.state !== JobState.Finished) return
    this.command.kill()
    this.initialize(true)
    this.activate()
  }

  // Force kill job and transcoding process
  forceKill() {
    EventLogger.log(this, `forceKill()`)

    this.command.forceKill()
  }

  // Called if an error occurs during transcoding, no other callbacks will be called
  onError(callback: (error: string) => void) {
    EventLogger.log(this, `onError()`)
    if (this.error) return callback(this.error)
    this.onErrorCallbacks.push(callback)
  }

  // Called when the video has been transcoded enough to start playing while the rest is still transcoding
  onStreamableReady(callback: () => void) {
    EventLogger.log(this, `onStreamableReady()`)
    if (this.isStreamableReady) return callback()
    this.onStreamableReadyCallbacks.push(callback)
  }

  // Called when transcoding process is 'reseting' (aka, seeking)
  onSeeking(callback: () => void) {
    EventLogger.log(this, `onSeeking()`)
    this.onSeekingCallbacks.push(callback)
  }

  onProgress(callback: (progress: ProgressInfo) => void) {
    EventLogger.log(this, `onProgress()`)
    if (this.lastProgressInfo) callback(this.lastProgressInfo)
    this.onProgressCallbacks.push(callback)
  }

  private resolveInitializedCallback() {
    EventLogger.log(this, `resolveInitializedCallback()`)
    this.onInitializedCallback?.()
    delete this.onInitializedCallback
  }

  private resolveErrorCallbacks() {
    EventLogger.log(this, `resolveErrorCallbacks()`)
    for (const callback of this.onErrorCallbacks) callback(this.error || 'Unknown error occurred.')
    this.onErrorCallbacks = []
  }

  private resolveStreamableReadyCallbacks() {
    EventLogger.log(this, `resolveStreamableReadyCallbacks()`)
    for (const callback of this.onStreamableReadyCallbacks) callback()
  }

  private resolveSeekingCallbacks() {
    EventLogger.log(this, `resolveSeekingCallbacks()`)
    for (const callback of this.onSeekingCallbacks) callback()
  }

  private resolveProgressCallbacks(info: ProgressInfo) {
    EventLogger.log(this, `resolveProgressCallbacks()`)
    for (const callback of this.onProgressCallbacks) callback(info)
  }

  private resolveTranscodeFinishedCallback() {
    EventLogger.log(this, `resolveTranscodeFinishedCallback()`)
    this.onTranscodeFinishedCallback?.()
    delete this.onTranscodeFinishedCallback
  }

  // Throw a fatal error to Video
  private throwError(error: string) {
    EventLogger.log(this, `throwError(${error})`)
    this.error = error || 'No error message provided.'
    this.state = JobState.Errored
    this.resolveErrorCallbacks()
    TranscoderQueue.processQueue()
  }

  // See if existing transcoded files are full or partial
  private async checkIfCacheComplete(): Promise<boolean> {
    EventLogger.log(this, `checkIfCacheComplete()`)

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

  // Amount of seconds that is transcoded/able to be played
  get availableSeconds(): number {
    if (this.state === JobState.Finished) return this.duration
    if (!this.lastProgressInfo) return 0
    return this.lastProgressInfo.availableSeconds + this.transcodedStartSeconds
  }
}
