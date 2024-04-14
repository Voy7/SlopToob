import fs from 'fs'
import path from 'path'
import generateSecret from '@/lib/generateSecret'
import ffmpeg from '@/lib/ffmpeg'
import Player from '@/stream/Player'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import type { ClientVideo } from '@/typings/types'
import TranscoderQueue from './TranscoderQueue'

export default class Video {
  readonly id: string = generateSecret()
  isReady: boolean = false
  path: string
  isBumper: boolean
  durationSeconds: number = 0
  error: string | null = null
  private isDownloading: boolean = false
  private readyCallbacks: ((isSuccess: boolean) => void)[] = []
  private isPlaying: boolean = false
  private isPaused: boolean = false
  private playingDate: Date | null = null
  private passedDurationSeconds: number = 0
  private finishedCallbacks: (() => void)[] = []
  private finishedTimeout: NodeJS.Timeout | null = null

  constructor(path: string, isBumper?: boolean) {
    this.path = path
    this.isBumper = isBumper || false
  }

  get clientVideo(): ClientVideo {
    return { id: this.id, path: this.path, name: this.name }
  }

  get currentSeconds(): number {
    if (!this.playingDate) return 0
    if (this.isPaused) return this.passedDurationSeconds
    return ((new Date().getTime() - this.playingDate.getTime()) / 1000) + this.passedDurationSeconds
  }

  // Pause video
  pause() {
    if (!this.isPlaying || this.isPaused || !this.playingDate) return
    if (this.finishedTimeout) {
      clearTimeout(this.finishedTimeout)
    }
    this.passedDurationSeconds += (new Date().getTime() - this.playingDate.getTime()) / 1000
    this.isPaused = true
    SocketUtils.broadcastStreamInfo()
  }

  // Unpause video
  unpause() {
    if (!this.isPlaying || !this.isPaused) return
    this.isPaused = false
    this.playingDate = new Date()
    this.finishedTimeout = setTimeout(() => this.finishPlaying(), (this.durationSeconds - this.passedDurationSeconds) * 1000)
    SocketUtils.broadcastStreamInfo()
  }

  forceFinish() {
    if (!this.isPlaying) return
    this.finishPlaying()
  }

  private finishPlaying() {
    if (!this.isPlaying) return
    this.finishedCallbacks.forEach(cb => cb())
    this.finishedCallbacks = []

    if (this.finishedTimeout) {
      clearTimeout(this.finishedTimeout)
    }

    this.isPlaying = false
    this.playingDate = null
    this.passedDurationSeconds = 0

    Logger.debug(`[Video] Finished playing in ${this.durationSeconds}s: ${this.name}`)
    SocketUtils.broadcastStreamInfo()
  }

  async play() {
    // Callback when finished playing
    return new Promise<void>(resolve => {
      this.finishedCallbacks.push(resolve)

      if (this.isPlaying) return

      this.isPlaying = true
      this.playingDate = new Date()
      this.finishedTimeout = setTimeout(() => this.finishPlaying(), this.durationSeconds * 1000)
      SocketUtils.broadcastStreamInfo()
    })
  }

  // Returns true when transcoded (or already ready), returns false if error
  async prepare(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.readyCallbacks.push((isSuccess: boolean) => resolve(isSuccess))
      // console.log(this)

      if (this.isReady) {
        resolve(true)
        return
      }
      if (this.isDownloading) return
      this.isDownloading = true

      Logger.debug(`[Video] Preparing video: ${this.name}`)
      const job = TranscoderQueue.newJob(this.inputPath, this.outputPath)
      // console.log(job)
      
      job.onStreamableReady(() => {
        console.log(`onFinishedSuccess ${this.name}`.cyan)
        this.isReady = true
        this.durationSeconds = job.duration
        this.resolveReadyCallbacks(true)
        // resolve(true)
      })

      job.onError(error => {
        console.log('onError'.cyan, error)
        this.error = error
        this.resolveReadyCallbacks(false)
      })

      job.onProgress(percentage => {
        // ...
      })

      job.activate()
    })
  }

  private resolveReadyCallbacks(isSuccess: boolean) {
    this.isDownloading = false
    console.log(`resolveReadyCallbacks (${this.readyCallbacks.length})`.cyan, isSuccess)
    for (const callback of this.readyCallbacks) {
      callback(isSuccess)
    }
    this.readyCallbacks = []
  }

  get inputPath(): string {
    // return path.join(Env.VIDEOS_PATH, this.path).replace(/\\/g, '/')
    // return this.path
    return path.resolve(this.path).replace(/\\/g, '/')
  }

  get outputPath(): string {
    // let newPath = path.join(Env.OUTPUT_PATH, this.path).replace(/\\/g, '/')
    // newPath = newPath.substring(0, newPath.lastIndexOf('.'))
    // return newPath
    
    if (this.isBumper) {
      const a = path.resolve(this.path)
      const filePath = a.split(Env.BUMPERS_PATH)[1]
      // console.log('get outputPath'.cyan, filePath)
      const newPath = path.join(Env.BUMPERS_OUTPUT_PATH, filePath).replace(/\\/g, '/')
      return newPath
    }

    const a = path.resolve(this.path)
    const filePath = a.split(Env.VIDEOS_PATH)[1]
    // console.log('get outputPath'.cyan, filePath, a)
    const newPath = path.join(Env.VIDEOS_OUTPUT_PATH, filePath).replace(/\\/g, '/')
    return newPath
  }

  get name() {
    let name = path.basename(this.path) // File name
    name = name.substring(0, name.lastIndexOf('.')) // Remove extension
    name = name.replace(/_/g, ' ') // Underscores to spaces
    name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) // Capatalize every word
    return name
  }

  get title() {
    return ''
  }

  get show() {
    return ''
  }

  get season() {
    return 0
  }

  get episode() {
    return 0
  }
}