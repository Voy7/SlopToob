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
  duration: number = 0
  error?: string
  lastProgressInfo?: ProgressInfo
  transcodedStartSeconds: number = 0

  private command: TranscoderCommand
  private onInitializedCallback?: () => void
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onTranscodeFinishedCallback?: () => void
  private cleanUpCallback?: () => void
  private onErrorCallbacks: Array<(error: string) => void> = []

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
      if (this.error) return

      Logger.debug('[TranscoderJob] Transcoding finished:', this.m3u8Path)
      this.state = JobState.Finished

      if (!this.isStreamableReady) {
        this.isStreamableReady = true
        this.resolveStreamableReadyCallbacks()
      }
      this.resolveTranscodeFinishedCallback()
      // Player.broadcastStreamInfo()
    })

    this.command.onError(async (error) => {
      Logger.error(`[TranscoderJob] Transcoding error ${this.video.name}:`, error)
      this.throwError('Transcoding error occurred. :(')
    })

    this.command.onProgress((progress) => {
      this.lastProgressInfo = progress
      SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, Player.adminStreamInfo)
      SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    })

    // When first segment is created
    this.command.onFirstChunk(async () => {
      this.isStreamableReady = true
      this.resolveStreamableReadyCallbacks()
      // Player.broadcastStreamInfo()
    })

    this.initialize()
  }

  // Initialize the job, check if transcoded files exist and are complete
  // Can be called multiple times, typically when 2+ videos are on this job and previous one finishes
  async initialize() {
    this.state = JobState.Initializing

    this.isStreamableReady = false

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
      const isFullCache = await this.checkIfCacheComplete()
      if (isFullCache) {
        this.state = JobState.Finished
        this.isStreamableReady = true
        this.resolveStreamableReadyCallbacks()
        this.resolveTranscodeFinishedCallback()
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
    console.log(`${this.video.name} activate()`.bgBlue, this)
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
      // this.cleanUpCallback = () => this.activate()
      this.onInitializedCallback = () => this.activate()
    }
  }

  // Resolves when transcoding is complete, or immediately if it's already done
  // This is seperate from the transcoding being restarted for seeking, etc. It's for TranscoderQueue to know when it's done
  async transcode(): Promise<void> {
    this.state = JobState.Transcoding

    return new Promise<void>((resolve: any) => {
      this.onTranscodeFinishedCallback = resolve
      this.onError(resolve)
      this.command.run()
    })
  }

  // Remove video from job, and clean up if no other videos are using this job
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

    this.isStreamableReady = false
    if (this.state === JobState.Transcoding) {
      this.state = JobState.CleaningUp
      this.command.kill()
    }
    this.state = JobState.CleaningUp

    const keepCache = this.video.isBumper ? Settings.cacheBumpers : Settings.cacheVideos
    if (!keepCache) {
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
      this.command.run()
      // Player.broadcastStreamInfo()
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
    if (this.error) return callback(this.error)
    this.onErrorCallbacks.push(callback)
  }

  private resolveInitializedCallback() {
    this.onInitializedCallback?.()
    delete this.onInitializedCallback
  }

  private resolveStreamableReadyCallbacks() {
    for (const callback of this.onStreamableReadyCallbacks) callback()
  }

  private resolveTranscodeFinishedCallback() {
    this.onTranscodeFinishedCallback?.()
    delete this.onTranscodeFinishedCallback
  }

  private resolveErrorCallbacks() {
    for (const callback of this.onErrorCallbacks) callback(this.error || 'Unknown error occurred.')
    this.onErrorCallbacks = []
  }

  // Throw a fatal error to Video
  private throwError(error: string) {
    this.error = error || 'No error message provided.'
    this.state = JobState.Errored
    this.resolveErrorCallbacks()
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

  // Amount of seconds that is transcoded/able to be played
  get availableSeconds(): number {
    if (this.state === JobState.Finished) return this.duration
    if (!this.lastProgressInfo) return 0
    return this.lastProgressInfo.availableSeconds + this.transcodedStartSeconds
  }
}
