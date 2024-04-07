import fs from 'fs'
import path from 'path'
import generateSecret from '@/lib/generateSecret'
import ffmpeg from '@/lib/ffmpeg'
import Player from '@/stream/Player'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import type { ClientVideo } from '@/typings/types'

export default class Video {
  id: string = generateSecret()
  isReady: boolean = false
  path: string
  isBumper: boolean
  durationSeconds: number = 0
  error: string | null = null
  private isDownloading: boolean = false
  private downloadCallbacks: ((isSuccess: boolean) => void)[] = []
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
      this.downloadCallbacks.push((isSuccess: boolean) => resolve(isSuccess))

      if (this.isDownloading) return

      const getTotalDuration = () => {
        const m3u8Path = this.outputPath + '/video.m3u8'
        const m3u8 = fs.readFileSync(m3u8Path, 'utf8')
        let duration: number = 0
        const lines = m3u8.split('\n')
        for (let i = 0; i < lines.length; i++) {
          // Sample line: #EXTINF:12.345,
          if (lines[i].includes('#EXTINF:')) {
            duration += parseFloat(lines[i].split(':')[1].split(',')[0])
          }
        }

        if (duration > 0) {
          this.durationSeconds = duration
          // console.log('Duration:', duration)
          this.isReady = true
          this.resolveDownloadCallbacks(true)
          return
        }

        this.error = 'Failed to get video duration.'
        this.resolveDownloadCallbacks(false)
      }

      // check if already downloaded (see if .m3u8 file exists)
      if (fs.existsSync(this.outputPath + '/video.m3u8')) {
        getTotalDuration()
        return
      }

      // Create output file path
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true })
      }

      Logger.debug('[Video] Transcoding video:', this.path)
      const ffmpegCommand = ffmpeg(this.inputPath, { timeout: 432000 }).addOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      
      ffmpegCommand.output(this.outputPath + '/video.m3u8')
    
      ffmpegCommand.on('end', () => {
        Logger.debug('[Video] Transcoding finished:', this.outputPath)
        getTotalDuration()
      })
      ffmpegCommand.on('error', (error) => {
        this.error = error.message
        Logger.error('[Video] Transcoding error:', error)
        this.resolveDownloadCallbacks(false)
      })
      
      ffmpegCommand.run()
    })
  }

  resolveDownloadCallbacks(isSuccess: boolean) {
    this.downloadCallbacks.forEach(cb => cb(isSuccess))
    this.downloadCallbacks = []
  }

  get inputPath(): string {
    // return path.join(Env.VIDEOS_PATH, this.path).replace(/\\/g, '/')
    return this.path
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
    const newPath = path.join(Env.OUTPUT_PATH, filePath).replace(/\\/g, '/')
    return newPath
  }

  get name() {
    return path.basename(this.path)
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