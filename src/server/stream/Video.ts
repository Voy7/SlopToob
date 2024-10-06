import path from 'path'
import generateSecret from '@/lib/generateSecret'
import videoInputToOutputPath from '@/lib/videoInputToOutputPath'
import parseVideoName from '@/lib/parseVideoName'
import parseTimestamp from '@/lib/parseTimestamp'
import Logger from '@/server/Logger'
import Player from '@/server/stream/Player'
import TranscoderJob from '@/server/stream/TranscoderJob'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import Settings from '@/server/Settings'
import SocketUtils from '@/server/socket/SocketUtils'
import PlayHistory from '@/server/stream/PlayHistory'
import VoteSkipHandler from '@/server/stream/VoteSkipHandler'
import Thumbnails from '@/server/stream/Thumbnails'
import EventLogger from '@/server/stream/VideoEventLogger'
import { socketClients } from '@/server/socket/socketClients'
import { Msg, VideoState as State } from '@/lib/enums'
import type { ClientVideo } from '@/typings/socket'

// Main video class (for both normal and bumpers)
export default class Video {
  readonly id: string = generateSecret()
  readonly name: string
  readonly isBumper: boolean
  readonly fromPlaylistID?: string
  readonly inputPath: string
  readonly outputPath: string
  readonly job: TranscoderJob
  durationSeconds: number = 0
  error?: string

  private passedDurationSeconds: number = 0
  private playingDate?: Date
  private finishedTimeout?: NodeJS.Timeout
  private readyCallbacks: Array<() => void> = []
  private finishedPlayingCallback?: () => void
  private playAfterSeek: boolean = true
  private bufferingTimeout?: NodeJS.Timeout
  isBuffering: boolean = false

  private _state: State = State.NotReady
  get state() {
    return this._state
  }
  private set state(newState: State) {
    this._state = newState
    if (Player.playing === this) Player.broadcastStreamInfo()
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, Player.clientVideoQueue)
  }

  constructor(filePath: string, isBumper: boolean = false, fromPlaylistID?: string) {
    this.name = parseVideoName(filePath)
    this.isBumper = isBumper
    this.fromPlaylistID = fromPlaylistID

    this.inputPath = path.resolve(filePath).replace(/\\/g, '/')
    this.outputPath = videoInputToOutputPath(this.inputPath, isBumper)

    this.job = TranscoderQueue.newJob(this)

    this.durationSeconds = this.job.duration

    // Fires when job has fatal error, fires immediately if already errored
    this.job.onError((error) => {
      EventLogger.log(this, `Job callback - onError(${error})`)
      Logger.error(`[Video] Threw an error: ${this.name} - ${error}`)

      this.error = 'Internal transcoding error occurred.'
      this.state = State.Errored
      this.startErrorDisplayTimeout()
    })

    // This wwill fire immediately if job is already ready/streamable
    // Can fire multiple times during Video's lifetime, usually because of seeking
    this.job.onStreamableReady(() => {
      EventLogger.log(this, `Job callback - onStreamableReady()`)

      if (this.error) return

      this.durationSeconds = this.job.duration

      // Video is not playing, but is now ready
      if (Player.playing !== this) {
        this.state = State.Ready
        this.resolveReadyCallbacks()
        return
      }

      // Video is being played & was waiting for transcode to play
      if (this.state === State.Preparing) {
        return this.initPlaying()
      }

      // Video is being played & new files/stream is ready (aka seeking to new time)
      if (this.state === State.Seeking) {
        if (this.playAfterSeek) {
          this.startFinishTimeout()
          this.state = State.Playing
          this.resolveReadyCallbacks()
          return
        }
        this.state = State.Paused
        this.resolveReadyCallbacks()
      }
    })

    // Fires when job is seeking (temporarily pausing playback)
    this.job.onSeeking(() => {
      EventLogger.log(this, `Job callback - onSeeking()`)
      if (Player.playing !== this) return

      this.playAfterSeek = this.state === State.Playing
      if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
      this.passedDurationSeconds = this.currentSeconds
      this.state = State.Seeking
    })

    this.job.onProgress(() => {
      if (!this.isBuffering) return
      this.bufferingCheck()
    })
  }

  // Resolves once video is ready to play, or immediately if already ready
  // Can be called multiple times, typically by Player to try and prepare it ahead of when it's needed
  async prepare(): Promise<void> {
    EventLogger.log(this, `prepare()`)

    if (this.error) return
    if (this.job.isStreamableReady) return

    return new Promise<void>((resolve) => {
      this.readyCallbacks.push(resolve)

      if (this.state === State.Preparing) return
      this.state = State.Preparing

      Logger.debug(`[Video] Preparing video: ${this.name}`)
      this.job.activate()
    })
  }

  // Resolves once video is finished playing, including if it was skipped or errored
  // Should only be called once per video & only when in `Player.playing` state
  async play() {
    EventLogger.log(this, `play()`)

    return new Promise<void>(async (resolve) => {
      this.finishedPlayingCallback = () => {
        VoteSkipHandler.disable()
        resolve()
      }

      await this.prepare()
      this.initPlaying()
    })
  }

  // Start playing video for FIRST time (not part of seeking or resuming)
  private initPlaying() {
    EventLogger.log(this, `initPlaying()`)
    Logger.info(`[Video] Playing video: ${this.name}`)

    PlayHistory.add(this)

    // If there's an error before playing started, show error screen
    if (this.error) {
      this.startErrorDisplayTimeout()
      return
    }

    VoteSkipHandler.enable()
    this.state = State.Playing
    this.startFinishTimeout()

    // Immediately pause if stream was paused before server restart
    if (Settings.streamIsPaused) {
      this.pause()
      return
    }

    // Immediately pause if 'pause when inactive' criteria is met
    if (Settings.pauseWhenInactive && socketClients.length <= 0) {
      this.pause(false)
      return
    }
  }

  // Must be called before being removed from the queue or Player
  // This is primarily so the TranscoderHandler can clean up shared jobs properly
  end(omitFromPreviousVideos: boolean = false) {
    EventLogger.log(this, `end()`)
    Logger.debug(`[Video] Finished playing: ${this.name}`)

    if (Player.playing === this && !this.error) {
      if (!omitFromPreviousVideos) Player.addPreviousVideo(this)
      Settings.set('streamIsPaused', false)
    }

    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    delete this.playingDate
    this.durationSeconds = 0
    this.passedDurationSeconds = 0
    this.state = State.Finished

    this.job.unlink(this)
    this.resolveFinishedCallback()
  }

  // Pause video, boolean return is if successful
  pause(persistPause: boolean = true): boolean {
    EventLogger.log(this, `pause()`)

    if (this.state !== State.Playing || !this.playingDate) return false
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.passedDurationSeconds += (new Date().getTime() - this.playingDate.getTime()) / 1000
    this.state = State.Paused
    if (persistPause) Settings.set('streamIsPaused', true)
    return true
  }

  // Unpause video, boolean return is if successful
  unpause(): boolean {
    EventLogger.log(this, `unpause()`)

    if (this.state !== State.Paused) return false
    this.startFinishTimeout()
    this.state = State.Playing
    Settings.set('streamIsPaused', false)
    return true
  }

  // Set video to a specific time in seconds
  seekTo(seconds: number) {
    EventLogger.log(this, `seekTo(${seconds})`)

    // Ensure seconds is within video duration
    if (seconds < 0) seconds = 0
    if (seconds > this.durationSeconds) seconds = this.durationSeconds

    if (this.state !== State.Playing && this.state !== State.Paused) return
    Logger.debug(`[Video] Seeking to ${parseTimestamp(seconds)}: ${this.name}`)

    this.passedDurationSeconds = seconds

    // If seek target is not transcoded yet, update transcoder job
    if (seconds < this.job.transcodedStartSeconds || seconds > this.job.availableSeconds) {
      this.playingDate = new Date()
      return this.job.seekTranscodeTo(seconds)
    }
    // Seek target is already transcoded
    if (this.state === State.Playing) {
      this.startFinishTimeout()
      Player.broadcastStreamInfo()
    }
  }

  // Start video playing timer normally, starting from this.passedDurationSeconds
  private startFinishTimeout() {
    EventLogger.log(this, `startFinishTimeout()`)
    this.playingDate = new Date()
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.finishedTimeout = setTimeout(
      () => this.end(),
      (this.durationSeconds - this.passedDurationSeconds + Settings.videoPaddingSeconds) * 1000
    )
    this.bufferingCheck()
  }

  private bufferingCheck() {
    EventLogger.log(this, `bufferingCheck()`)

    const diff = this.job.availableSeconds - this.currentSeconds
    console.log(`${this.job.availableSeconds} - ${this.currentSeconds} = ${diff}`)
    if (diff > 2000) {
      this.bufferingTimeout = setTimeout(() => this.bufferingCheck(), diff * 1000)
      if (!this.isBuffering) return
      this.isBuffering = false
      Player.broadcastStreamInfo()
      return
    }
    if (this.isBuffering) return
    this.isBuffering = true
    this.passedDurationSeconds = this.currentSeconds
    clearTimeout(this.finishedTimeout)
    Player.broadcastStreamInfo()
  }

  // Start video playing timer for error display
  // It's ok to call this even if video is not playing, it checks first
  private startErrorDisplayTimeout() {
    EventLogger.log(this, `startErrorDisplayTimeout()`)
    if (Player.playing !== this) return
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.finishedTimeout = setTimeout(() => this.end(), Settings.errorDisplaySeconds * 1000)
    Player.broadcastStreamInfo()
  }

  private resolveReadyCallbacks() {
    EventLogger.log(this, `resolveReadyCallbacks()`)
    for (const callback of this.readyCallbacks) callback()
    this.readyCallbacks = []
  }

  private resolveFinishedCallback() {
    EventLogger.log(this, `resolveFinishedCallback()`)
    this.finishedPlayingCallback?.()
    delete this.finishedPlayingCallback
  }

  // Current time of whole video in seconds (not considering transcoded video time)
  get currentSeconds(): number {
    if (!this.playingDate) return 0
    if (this.isBuffering) return this.passedDurationSeconds
    if (this.state === State.Paused) return this.passedDurationSeconds
    if (this.state === State.Seeking) return this.passedDurationSeconds
    return (new Date().getTime() - this.playingDate.getTime()) / 1000 + this.passedDurationSeconds
  }

  get clientVideo(): ClientVideo {
    return {
      id: this.id,
      jobID: this.job.id,
      state: this.state,
      name: this.name,
      isBumper: this.isBumper,
      path: this.inputPath,
      thumbnailURL: Thumbnails.getURL(this.inputPath),
      isPlaying: Player.playing === this,
      error: this.error
    }
  }

  get fromPlaylistName(): string | null {
    if (!this.fromPlaylistID) return null
    return Player.playlists.find((pl) => pl.id === this.fromPlaylistID)?.name || null
  }
}
