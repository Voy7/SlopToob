import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg, { transcodeArgs } from '@/lib/ffmpeg'
import generateSecret from '@/lib/generateSecret'
import Logger from '@/lib/Logger'
import TranscoderQueue from '@/stream/TranscoderQueue'
import Settings from './Settings'
import type Video from '@/stream/Video'
import SocketUtils from '@/lib/SocketUtils'
import { JobState, SocketEvent } from '@/lib/enums'
import type { FfmpegCommand } from 'fluent-ffmpeg'

// Represents a transcoding job
export default class TranscoderJob {
  readonly id: string = generateSecret()
  isReady: boolean = false
  // isTranscoding: boolean = false
  duration: number = 0
  progressPercentage: number = 0
  private ffmpegCommand: FfmpegCommand = null as any // Typescript is dumb, this is initialized in constructor
  private onInitializedCallbacks: Array<() => void> = []
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onTranscodeFinishedCallbacks: Array<() => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onProgressCallbacks: Array<(percentage: number) => void> = []
  private cleanUpCallback: (() => void) | null = null
  private m3u8Path: string

  private _state: JobState = JobState.Initializing
  videos: Video[] = []
  error: string | null = null

  get state() { return this._state }
  private set state(value: JobState) {
    this._state = value
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    console.log(`s: ${value} (${this.video.name})`)
    // if (value === 'finished') this.cleanup()
  }

  // Running completeJob() will see if the transcoded files already exist, if so the job is already done
  // If an error is thrown, that means we need to start transcoding logic
  constructor(public video: Video) {
    this.videos.push(this.video)
    this.m3u8Path = path.join(this.video.outputPath, '/video.m3u8')
    this.initialize()
  }

  initialize() {
    this.state = JobState.Initializing

    this.ffmpegCommand = ffmpeg(this.video.inputPath, { timeout: 432000 }).addOptions(transcodeArgs)
    this.ffmpegCommand.output(path.join(this.video.outputPath, '/video.m3u8'))
  
    this.ffmpegCommand.on('end', async () => {
      // For some stupid reason, 'error' fires after 'end'. So wait a couple ms to make sure errors are handled
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`ffmpeg end`.yellow, this.error)

      if (this.state === JobState.CleaningUp) {
        await this.cleanup()
        return
      }

      if (this.error) {
        this.state = JobState.Errored
        this.resolveErrorCallbacks()
      }

      if (this.state === JobState.Finished) { // Was killed due to no more videos remaining
        await this.cleanup()
        return
      }

      Logger.debug('[Video] Transcoding finished:', this.video.outputPath)
      // this.state = 'finished'
      
      try { await this.checkIfComplete() }
      catch (error: any) {
        Logger.error('[Video] E03 Transcoding error:', error)
        this.error = error.message
        for (const callback of this.onErrorCallbacks) callback(error.message)
      }
    })

    // If ffmpeg error occurs, Note this gets called after 'end' event
    this.ffmpegCommand.on('error', async (error) => {
      Logger.error(`[Video] Transcoding error ${this.video.name}:`, error)
      this.error = 'Transcoding error occurred. :('

      if (this.state === JobState.CleaningUp) {
        await this.cleanup()
        return
      }
    })
    
    // When first segment is created
    this.ffmpegCommand.on('progress', async (progress) => {
      if (!this.isReady) {
        if (!fs.existsSync(this.m3u8Path)) return
        this.isReady = true
        for (const callback of this.onStreamableReadyCallbacks) callback()
      }
    })

    const asyncInit = async () => {
      // Get the duration of the video
      try { this.duration = await this.getVideoDuration() }
      catch (error: any) { // If we can't get the duration, it's a hard fail
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
            Logger.warn('[Video] Partial transcoded files existed, deleting cache:', this.video.outputPath)
            await fsAsync.rm(this.video.outputPath, { recursive: true })
          }
        }
      }
      catch (error: any) {
        Logger.error('[Video] Transcoding error:', error)
        this.error = error.message
        this.state = JobState.Errored
        this.resolveErrorCallbacks()
        return
      }

      try {
        await this.checkIfComplete()
        this.resolveInitializedCallbacks()
      }
      catch (_) {
        this.state = JobState.Idle
        this.resolveInitializedCallbacks()
      }
    }
    asyncInit()
  }

  // private callbacks() {
  //   if (this.state === JobState.Initializing) return
  //   if (this.state === JobState.Idle) return
  //   if (this.state === JobState.AwaitingTranscode) return
  //   if (this.state === JobState.Transcoding) return
  // }

  // Add this job to the queue
  activate() {
    console.log(`activate() - ${this.video.name}`.yellow, this.state)
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
  // Should only be called once
  async transcode(): Promise<void>{
    console.log(`transcode() - ${this.video.name}`.yellow, this.state)
    if (this.state !== JobState.AwaitingTranscode) throw new Error('Transcoding job is not in the correct state to start transcoding.')
    this.state = JobState.Transcoding

    return new Promise<void>((resolve: any) => {
      this.onTranscodeFinished(resolve)
      this.onError(resolve)

      fs.mkdirSync(this.video.outputPath, { recursive: true })
      this.ffmpegCommand.run()
    })
  }

  async unlink(video: Video) {
    const index = this.videos.findIndex(item => item === video)
    if (index !== -1) this.videos.splice(index, 1)
    await this.cleanup()
  }

  // Clean up job and stop transcoding if it's still running
  // This should be called when video has finished playing, or when it's removed from the queue
  async cleanup() {
    // If no more videos in job, do cleanup
    if (this.videos.length > 0) return

    if (this.state === JobState.Transcoding) {
      this.state = JobState.CleaningUp
      this.ffmpegCommand.kill('SIGKILL')
      return // Cleanup will be called again when ffmpeg command finishes
    }

    this.isReady = false
    this.state = JobState.CleaningUp
    console.log(`CleaningUp - ${this.video.name}`)

    const { cacheVideos, cacheBumpers } = Settings.getSettings()
    const keepCache = this.video.isBumper ? cacheBumpers : cacheVideos

    if (!keepCache) {
      try { fs.rmSync(this.video.outputPath, { recursive: true }) }
      catch (error) { Logger.warn(`[Video] Error deleting video cache: ${this.video.outputPath}`) }
    }
    // wait 1 second for files to delete
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (this.videos.length > 0) {
      this.initialize()
      // this.activate()
      this.cleanUpCallback?.()
      return
    }

    // Remove job from queue
    const index = TranscoderQueue.jobs.findIndex(item => item === this)
    if (index !== -1) TranscoderQueue.jobs.splice(index, 1)

    // this.state = JobState.
    // console.log(`Finished - ${this.video.name}`)
    this.initialize()
    // this.cleanUpCallback?.()

    // console.log('cleanup()'.yellow, this.videos.length)
    // if (this.videos.length > 0) {
    //   this.activate()
    //   return
    // }
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
    // this.onTranscodeFinishedCallbacks = []
  }

  private resolveErrorCallbacks() {
    for (const callback of this.onErrorCallbacks) callback(this.error as string)
    // this.onErrorCallbacks = []
  }

  // Private callback for when ffmpeg command has been created
  // private onFfmpegCmdReady(callback: () => void) {
  //   if (this.ffmpegCmdReady) callback()
  //   else this.onFfmpegCmdReadyCallback = callback
  // }

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
  private async getVideoDuration(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(this.video.inputPath, (error, metadata) => {
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
}