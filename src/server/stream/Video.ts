import path from 'path'
import generateSecret from '@/lib/generateSecret'
import parseVideoName from '@/lib/parseVideoName'
import parseTimestamp from '@/lib/parseTimestamp'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Player from '@/server/stream/Player'
import TranscoderJob from '@/server/stream/TranscoderJob'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import Settings from '@/server/Settings'
import SocketUtils from '@/server/socket/SocketUtils'
import PlayHistory from '@/server/stream/PlayHistory'
import VoteSkipHandler from '@/server/stream/VoteSkipHandler'
import { socketClients } from '@/server/socket/socketClients'
import { Msg, VideoState as State } from '@/lib/enums'
import type { ClientVideo } from '@/typings/types'

export default class Video {
  readonly id: string = generateSecret()
  readonly name: string
  readonly isBumper: boolean
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
  private readonly fromPlaylistID?: string

  private _state: State = State.NotReady
  get state() {
    return this._state
  }
  private set state(newState: State) {
    this._state = newState
    if (Player.playing === this) Player.broadcastStreamInfo()
    else SocketUtils.broadcastAdmin(Msg.AdminQueueList, Player.clientVideoQueue)
  }

  constructor(filePath: string, isBumper: boolean = false, fromPlaylistID?: string) {
    this.name = parseVideoName(filePath)
    this.isBumper = isBumper
    this.fromPlaylistID = fromPlaylistID

    this.inputPath = path.resolve(filePath).replace(/\\/g, '/')

    const basePath = this.isBumper ? Env.BUMPERS_PATH : Env.VIDEOS_PATH
    const outputBasePath = this.isBumper ? Env.BUMPERS_OUTPUT_PATH : Env.VIDEOS_OUTPUT_PATH
    const newPath = filePath.replace(basePath, '')
    this.outputPath = path.join(outputBasePath, newPath).replace(/\\/g, '/')

    this.job = TranscoderQueue.newJob(this)

    this.durationSeconds = this.job.duration

    // Fires when job has fatal error, fires immediately if already errored
    this.job.onError((error) => {
      this.error = 'Internal transcoding error occurred.'
      this.state = State.Errored
      this.startErrorDisplayTimeout()
    })

    // This wwill fire immediately if job is already ready/streamable
    // Can fire multiple times during Video's lifetime, usually because of seeking
    this.job.onStreamableReady(() => {
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
          this.state = State.Playing
          this.startFinishTimeout()
          this.resolveReadyCallbacks()
          return
        }
        this.state = State.Paused
        this.resolveReadyCallbacks()
      }
    })
  }

  // Resolves once video is ready to play, or immediately if already ready
  // Can be called multiple times, typically by Player to try and prepare it ahead of when it's needed
  async prepare(): Promise<void> {
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
    Logger.debug(`[Video] Playing video: ${this.name}`)

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
  end() {
    Logger.debug(`[Video] Finished playing: ${this.name}`)

    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    delete this.playingDate
    this.durationSeconds = 0
    this.passedDurationSeconds = 0
    this.state = State.Finished

    this.job.unlink(this)
    Settings.setSetting('streamIsPaused', false)
    this.resolveFinishedCallback()
  }

  // Pause video, boolean return is if successful
  pause(persistPause: boolean = true): boolean {
    if (this.state !== State.Playing || !this.playingDate) return false
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.passedDurationSeconds += (new Date().getTime() - this.playingDate.getTime()) / 1000
    this.state = State.Paused
    if (persistPause) Settings.setSetting('streamIsPaused', true)
    return true
  }

  // Unpause video, boolean return is if successful
  unpause(): boolean {
    if (this.state !== State.Paused) return false
    this.startFinishTimeout()
    this.state = State.Playing
    Settings.setSetting('streamIsPaused', false)
    return true
  }

  // Set video to a specific time in seconds
  seekTo(seconds: number) {
    if (this.state !== State.Playing && this.state !== State.Paused) return
    Logger.debug(`[Video] Seeking to ${parseTimestamp(seconds)}: ${this.name}`)

    this.passedDurationSeconds = seconds

    // If seek target is not transcoded yet, update transcoder job
    if (seconds < this.job.transcodedStartSeconds || seconds > this.job.availableSeconds) {
      this.playAfterSeek = this.state === State.Playing
      this.state = State.Seeking
      if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
      this.job.seekTranscodeTo(seconds)
      return
    }
    // Seek target is already transcoded
    if (this.state === State.Playing) {
      this.startFinishTimeout()
      Player.broadcastStreamInfo()
    }
  }

  // Start video playing timer normally, starting from this.passedDurationSeconds
  private startFinishTimeout() {
    this.playingDate = new Date()
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.finishedTimeout = setTimeout(
      () => this.end(),
      (this.durationSeconds - this.passedDurationSeconds + Settings.videoPaddingSeconds) * 1000
    )
  }

  // Start video playing timer for error display
  // It's ok to call this even if video is not playing, it checks first
  private startErrorDisplayTimeout() {
    if (Player.playing !== this) return
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.finishedTimeout = setTimeout(() => this.end(), Settings.errorDisplaySeconds * 1000)
    Player.broadcastStreamInfo()
  }

  private resolveReadyCallbacks() {
    for (const callback of this.readyCallbacks) callback()
    this.readyCallbacks = []
  }

  private resolveFinishedCallback() {
    this.finishedPlayingCallback?.()
    delete this.finishedPlayingCallback
  }

  // Current time of whole video in seconds (not considering transcoded video time)
  get currentSeconds(): number {
    if (!this.playingDate) return 0
    if (this.state === State.Paused) return this.passedDurationSeconds
    return (new Date().getTime() - this.playingDate.getTime()) / 1000 + this.passedDurationSeconds
  }

  get clientVideo(): ClientVideo {
    return { id: this.id, state: this.state, name: this.name, path: this.inputPath }
  }

  get fromPlaylistName(): string | null {
    if (!this.fromPlaylistID) return null
    return Player.playlists.find((pl) => pl.id === this.fromPlaylistID)?.name || null
  }
}
