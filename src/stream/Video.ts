import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import generateSecret from '@/lib/generateSecret'
import ffmpeg from '@/lib/ffmpeg'
import Player from '@/stream/Player'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import TranscoderQueue from '@/stream/TranscoderQueue'
import TranscoderJob from '@/stream/TranscoderJob'
import Settings from '@/stream/Settings'
import SocketUtils from '@/lib/SocketUtils'
import PlayHistory from '@/stream/PlayHistory'
import { Msg, VideoState as State } from '@/lib/enums'
import type { ClientVideo } from '@/typings/types'
import VoteSkipHandler from './VoteSkipHandler'

export default class Video {
  readonly id: string = generateSecret()
  private path: string
  private _state: State = State.NotReady
  error: string | null = null
  durationSeconds: number = 0
  private readyCallbacks: (() => void)[] = []
  private playingDate: Date | null = null
  private passedDurationSeconds: number = 0
  private finishedCallbacks: (() => void)[] = []
  private finishedTimeout: NodeJS.Timeout | null = null
  private job: TranscoderJob

  constructor(path: string, public isBumper: boolean = false) {
    this.path = path.replace(/\\/g, '/')

    this.job = TranscoderQueue.newJob(this)
    
    this.job.onStreamableReady(() => {
      this.durationSeconds = this.job.duration
      // if (this.state === State.Preparing) this.state = State.Ready
      // this.state = State.Ready
      if (this.state !== State.Playing && this.state !== State.Paused && this.state !== State.Errored) this.state = State.Ready
      this.resolveReadyCallbacks()
    })

    this.job.onError(async error => {
      this.error = error
      this.state = State.Errored
      this.resolveFinishedCallbacks()
    })

    this.job.onProgress(percentage => {
      // ...
    })
  }

  get state() { return this._state }
  private set state(newState: State) {
    this._state = newState
    if (Player.playing === this) SocketUtils.broadcast(Msg.StreamInfo, Player.clientStreamInfo)
    else SocketUtils.broadcastAdmin(Msg.AdminQueueList, Player.queue.map(video => video.clientVideo))
  }

  // Returns true when transcoded (or already ready), returns false if error
  async prepare(): Promise<void> {
    if (this.state !== State.NotReady && this.state !== State.Preparing) return

    return new Promise<void>(resolve => {
      this.readyCallbacks.push(resolve)
      this.finishedCallbacks.push(resolve)

      if (this.state === State.Preparing) return
      this.state = State.Preparing

      Logger.debug(`[Video] Preparing video: ${this.name}`)
      this.job.activate()
    })
  }

  async play() {
    await this.prepare()
    // if (this.state === State.Finished) throw new Error(`Tried to play video that has already been played: ${this.name}`)
    if (this.state === State.Finished) return
    
    // Callback when finished playing
    return new Promise<void>(resolve => {
      this.finishedCallbacks.push(() => VoteSkipHandler.disable())
      this.finishedCallbacks.push(resolve)

      if (this.state === State.Playing || this.state === State.Paused) return
      Logger.debug(`[Video] Playing video: ${this.name}`, this.state)

      PlayHistory.add(this.inputPath)

      if (this.state === State.Errored) {
        const { errorDisplaySeconds } = Settings.getSettings()
        this.finishedTimeout = setTimeout(() => this.end(), errorDisplaySeconds * 1000)
        SocketUtils.broadcast(Msg.StreamInfo, Player.clientStreamInfo)
        return
      }

      VoteSkipHandler.enable()
      this.state = State.Playing
      this.playingDate = new Date()
      this.finishedTimeout = setTimeout(() => this.end(), this.durationSeconds * 1000)
    })
  }

  // Must be called before being removed from the queue or Player
  // This is primarily so the Transcoder Handler can clean up shared jobs properly
  end() {
    if (this.finishedTimeout) {
      clearTimeout(this.finishedTimeout)
    }
    
    Logger.debug(`[Video] Finished playing in ${this.durationSeconds}s: ${this.name}`)
    this.error = null
    this.playingDate = null
    this.durationSeconds = 0
    this.passedDurationSeconds = 0
    this.state = State.Finished
    this.resolveFinishedCallbacks()

    this.job.unlink(this)
  }

  // Pause video
  pause() {
    if (this.state !== State.Playing || !this.playingDate) return
    if (this.finishedTimeout) clearTimeout(this.finishedTimeout)
    this.passedDurationSeconds += (new Date().getTime() - this.playingDate.getTime()) / 1000
    this.state = State.Paused
  }

  // Unpause video
  unpause() {
    if (this.state !== State.Paused) return
    this.playingDate = new Date()
    this.finishedTimeout = setTimeout(() => this.end(), (this.durationSeconds - this.passedDurationSeconds) * 1000)
    this.state = State.Playing
  }

  private resolveReadyCallbacks() {
    for (const callback of this.readyCallbacks) callback()
    this.readyCallbacks = []
  }

  private resolveFinishedCallbacks() {
    for (const callback of this.finishedCallbacks) callback()
    this.finishedCallbacks = []
  }

  get clientVideo(): ClientVideo {
    return { id: this.id, state: this.state, name: this.name, path: this.path }
  }

  get currentSeconds(): number {
    if (!this.playingDate) return 0
    if (this.state === State.Paused) return this.passedDurationSeconds
    return ((new Date().getTime() - this.playingDate.getTime()) / 1000) + this.passedDurationSeconds
  }

  get inputPath(): string {
    return path.resolve(this.path).replace(/\\/g, '/')
  }

  get outputPath(): string {
    const basePath = this.isBumper ? Env.BUMPERS_PATH : Env.VIDEOS_PATH
    const outputBasePath = this.isBumper ? Env.BUMPERS_OUTPUT_PATH : Env.VIDEOS_OUTPUT_PATH
    const newPath = this.path.replace(basePath, '')
    return path.join(outputBasePath, newPath).replace(/\\/g, '/')
  }

  get name() {
    let name = path.basename(this.path) // File name
    if (name.includes('.')) name = name.substring(0, name.lastIndexOf('.')) // Remove extension if it exists
    name = name.replace(/_/g, ' ') // Underscores to spaces
    name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) // Capatalize every word
    return name
  }

  // TODO: Implement these
  get title() { return '' }
  get show() { return '' }
  get season() { return 0 }
  get episode() { return 0 }
}