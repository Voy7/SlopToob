import fs from 'fs'
import path from 'path'
import Player from '@/stream/Player'
import Env from '@/EnvVariables'
import generateSecret from '@/lib/generateSecret'
import { broadcastStreamInfo } from '@/server/socket'

import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'

ffmpeg.setFfmpegPath(ffmpegStatic!)

export default class Video {
  id: string = generateSecret()
  isReady: boolean = false
  error: string | null = null
  path: string
  isBumper: boolean
  isDownloading: boolean = false
  downloadCallbacks: ((isSuccess: boolean) => void)[] = []
  durationSeconds: number = 0
  startPlayingDate: Date | null = null

  constructor(path: string, isBumper?: boolean) {
    this.path = path
    this.isBumper = isBumper || false
  }

  get currentSeconds(): number {
    if (!this.startPlayingDate) return 0
    const diff = new Date().getTime() - this.startPlayingDate.getTime()
    return diff / 1000
  }

  async play() {
    this.startPlayingDate = new Date()

    broadcastStreamInfo()

    // Wait for video time to finish
    await new Promise(resolve => setTimeout(resolve, this.durationSeconds * 1000))

    Player.playNext()

    // Once finished
    // Player.playNext()
  }

  // Returns true when downloaded (or already ready), returns false if error
  async download(): Promise<boolean> {
    return await new Promise<boolean>(resolve => {
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
          console.log('Duration:', duration)
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
        console.log('ffmpeg finished'.green)

        getTotalDuration()
      })
      ffmpegCommand.on('error', (err) => {
        this.error = err.message
        console.error('Error:', err)
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
    
    const a = path.resolve(this.path)
    const filePath = a.split(Env.VIDEOS_PATH)[1]
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