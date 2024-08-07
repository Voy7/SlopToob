import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import generateSecret from '@/lib/generateSecret'
import ffmpeg from '@/lib/ffmpeg'
import Logger from '@/server/Logger'
import TranscoderCommand from '@/stream/TranscoderCommand'
import TranscoderQueue from '@/stream/TranscoderQueue'
import Settings from './Settings'
import SocketUtils from '@/lib/SocketUtils'
import { JobState, Msg } from '@/lib/enums'
import type Video from '@/stream/Video'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import { ProgressInfo } from '@/typings/types'
import Player from './Player'

// Represents a transcoding job
export default class TranscoderJob {
  readonly id: string = generateSecret()
  streamID: string = generateSecret()
  isReady: boolean = false
  // isTranscoding: boolean = false
  duration: number = 0
  // progressPercentage: number = 0
  private command: TranscoderCommand = null as any // Typescript is dumb, this is initialized in constructor
  private onInitializedCallbacks: Array<() => void> = []
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onTranscodeFinishedCallbacks: Array<() => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onProgressCallbacks: Array<(percentage: number) => void> = []
  private cleanUpCallback: (() => void) | null = null
  m3u8Path: string
  lastProgressInfo: ProgressInfo | null = null

  private _state: JobState = JobState.Initializing
  videos: Video[] = []
  error: string | null = null
  transcodedStartSeconds: number = 0

  get state() {
    return this._state
  }
  private set state(value: JobState) {
    if (this._state === value) return
    this._state = value
    SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
  }

  // Running completeJob() will see if the transcoded files already exist, if so the job is already done
  // If an error is thrown, that means we need to start transcoding logic
  constructor(public video: Video) {
    this.videos.push(this.video)
    this.m3u8Path = path.join(this.video.outputPath, '/video.m3u8')
    this.initialize()
  }

  async seekTranscodeTo(seconds: number) {
    this.transcodedStartSeconds = seconds
    if (this.state !== JobState.Transcoding && this.state !== JobState.Finished) return
    this.isReady = false
    this.command.kill()
    await fsAsync.rm(this.video.outputPath, { recursive: true, force: true })
    this.streamID = generateSecret()
    Player.broadcastStreamInfo()
    await this.transcode()
    Player.broadcastStreamInfo()
  }

  initialize() {
    this.state = JobState.Initializing

    this.command = new TranscoderCommand(this)

    this.command.onEnd(async () => {
      // For some stupid reason, 'error' fires after 'end'. So wait a couple ms to make sure errors are handled
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // console.log(`ffmpeg end`.yellow, this.error)

      // if (this.state === JobState.CleaningUp) {
      //   await this.cleanup()
      //   return
      // }

      if (this.error) {
        this.state = JobState.Errored
        this.resolveErrorCallbacks()
      }

      if (this.state === JobState.Finished) {
        // Was killed due to no more videos remaining
        // await this.cleanup()
        return
      }

      Logger.debug('[Video] Transcoding finished:', this.video.outputPath)
      // this.state = 'finished'

      try {
        await this.checkIfComplete()
      } catch (error: any) {
        Logger.error('[Video] E03 Transcoding error:', error)
        this.error = error.message
        for (const callback of this.onErrorCallbacks) callback(error.message)
      }
    })

    this.command.onProgress((progress) => {
      // console.log(progress)
      this.lastProgressInfo = progress
      SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, Player.adminStreamInfo)
      SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    })

    // If ffmpeg error occurs, Note this gets called after 'end' event
    this.command.onError(async (error) => {
      Logger.error(`[Video] Transcoding error ${this.video.name}:`, error)
      this.error = 'Transcoding error occurred. :('

      // if (this.state === JobState.CleaningUp) {
      //   await this.cleanup()
      //   return
      // }
    })

    // When first segment is created
    this.command.onFirstChunk(async () => {
      console.log('First chunk' + this.video.outputPath)
      if (this.isReady) return
      this.isReady = true
      for (const callback of this.onStreamableReadyCallbacks) callback()
      Player.broadcastStreamInfo()
    })

    const asyncInit = async () => {
      // Get the duration of the video
      try {
        this.duration = await TranscoderJob.getVideoDuration(this.video.inputPath)
      } catch (error: any) {
        // If we can't get the duration, it's a hard fail
        Logger.error('[Video] Transcoding error:', error)
        this.error = error
        this.state = JobState.Errored
        this.resolveErrorCallbacks()
        return
      }

      // Check if partial/incomplete transcoded files exist & delete them if so
      try {
        if (fs.existsSync(this.m3u8Path)) {
          const m3u8Content = await fsAsync.readFile(this.m3u8Path, 'utf8')
          if (!m3u8Content.includes('#EXT-X-ENDLIST')) {
            Logger.warn(
              '[Video] Partial transcoded files existed, deleting cache:',
              this.video.outputPath
            )
            await fsAsync.rm(this.video.outputPath, { recursive: true, force: true })
          }
        }
      } catch (error: any) {
        Logger.error('[Video] Transcoding error:', error)
        this.error = error.message
        this.state = JobState.Errored
        this.resolveErrorCallbacks()
        return
      }

      try {
        await this.checkIfComplete()
        this.resolveInitializedCallbacks()
      } catch (_) {
        this.state = JobState.Idle
        this.resolveInitializedCallbacks()
      }
    }
    asyncInit()
  }

  // Add this job to the queue
  activate() {
    if (this.state === JobState.Errored) {
      this.resolveErrorCallbacks()
      return
    }

    if (this.isReady) {
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
      this.onInitialized(() => this.activate())
    }

    if (this.state === JobState.CleaningUp) {
      this.cleanUpCallback = () => this.activate()
    }
  }

  // Actually start the transcoding process
  // Should only be called once - (TODO ADJUSTING)
  async transcode(): Promise<void> {
    // if (this.state !== JobState.AwaitingTranscode)
    //   throw new Error('[TranscoderJob] Job is not in the correct state to start transcoding.')
    this.state = JobState.Transcoding

    return new Promise<void>((resolve: any) => {
      this.onTranscodeFinished(resolve)
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
    if (this.videos.length > 0) return // If no more videos in job, do cleanup

    if (this.state === JobState.Transcoding) {
      this.state = JobState.CleaningUp
      this.command.kill()
      //return // Cleanup will be called again when ffmpeg command finishes
    }

    this.isReady = false
    this.state = JobState.CleaningUp

    const keepCache = this.video.isBumper ? Settings.cacheBumpers : Settings.cacheVideos

    if (!keepCache) {
      try {
        fs.rmSync(this.video.outputPath, { recursive: true, force: true })
      } catch (error) {
        Logger.warn(`[Video] Error deleting video cache: ${this.video.outputPath}`)
      }
    }
    // wait 1 second for files to delete
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (this.videos.length > 0) {
      this.initialize()
      // this.activate()
      this.cleanUpCallback?.()
      return
    }

    // Remove job from queue
    const index = TranscoderQueue.jobs.findIndex((item) => item === this)
    if (index !== -1) TranscoderQueue.jobs.splice(index, 1)

    // console.log(`Finished - ${this.video.name}`)
    this.initialize()
  }

  onInitialized(callback: () => void) {
    if (this.state !== JobState.Initializing) return callback()
    this.onInitializedCallbacks.push(callback)
  }

  // Called when the video has been transcoded enough to start playing while the rest is still transcoding
  onStreamableReady(callback: () => void) {
    if (this.isReady) return callback()
    this.onStreamableReadyCallbacks.push(callback)
  }

  // Called when the transcode is fully finished, with no errors
  onTranscodeFinished(callback: () => void) {
    if (this.state === JobState.Finished) return callback()
    this.onTranscodeFinishedCallbacks.push(callback)
  }

  // Called if an error occurs during transcoding, no other callbacks will be called
  onError(callback: (error: string) => void) {
    if (this.state === JobState.Errored && this.error) return callback(this.error)
    this.onErrorCallbacks.push(callback)
  }

  // Called when progress is made during transcoding
  onProgress(callback: (percentage: number) => void) {
    this.onProgressCallbacks.push(callback)
  }

  private resolveInitializedCallbacks() {
    for (const callback of this.onInitializedCallbacks) callback()
    this.onInitializedCallbacks = []
  }

  private resolveStreamableReadyCallbacks() {
    for (const callback of this.onStreamableReadyCallbacks) callback()
    this.onStreamableReadyCallbacks = []
  }

  private resolveTranscodeFinishedCallbacks() {
    for (const callback of this.onTranscodeFinishedCallbacks) callback()
    this.onTranscodeFinishedCallbacks = []
  }

  private resolveErrorCallbacks() {
    for (const callback of this.onErrorCallbacks) callback(this.error as string)
    this.onErrorCallbacks = []
  }

  // Get additional info about a completed job
  // Currently only used for getting duration, can be expanded in the future
  private async checkIfComplete() {
    if (this.state === JobState.Finished) return

    if (!fs.existsSync(this.m3u8Path)) throw new Error('Transcoded files do not exist.')

    this.state = JobState.Finished
    this.isReady = true
    this.resolveStreamableReadyCallbacks()
    this.resolveTranscodeFinishedCallbacks()
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
        resolve(duration + Settings.videoPaddingSeconds)
      })
    })
  }

  get availableSeconds(): number {
    if (this.state === JobState.Finished) return this.duration
    if (!this.lastProgressInfo) return 0
    return this.lastProgressInfo.availableSeconds + this.transcodedStartSeconds
  }
}
