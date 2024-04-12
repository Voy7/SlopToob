import fs from 'fs'
import path from 'path'
import ffmpeg from '@/lib/ffmpeg'
import Logger from '@/lib/Logger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import TranscoderQueue from '@/stream/TranscoderQueue'

// Represents a transcoding job
export default class TranscoderJob {
  isFinished: boolean = false
  isTranscoding: boolean = false
  duration: number = 0
  progressPercentage: number = 0
  private ffmpegCommand: FfmpegCommand | null = null
  private onFinishedSuccessCallbacks: Array<() => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onProgressCallbacks: Array<(percentage: number) => void> = []

  // Running completeJob() will see if the transcoded files already exist, if so the job is already done
  // If an error is thrown, that means we need to start transcoding logic
  constructor(readonly inputPath: string, readonly outputPath: string) {
    try { this.completeJob() }
    catch (error) {
      this.ffmpegCommand = ffmpeg(this.inputPath, { timeout: 432000 }).addOptions([
        // -preset veryfast -vf "scale='min(1920,iw)':-2" -c:v libx264 -crf 23 -pix_fmt yuv420p -map 0:v:0 -c:a aac -ac 2 -b:a 192k -map 0:a:0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8
        '-preset veryfast',
        // `-vf "scale='min(1920,iw)':-2"`,
        '-c:v libx264',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-map 0:v:0',
        '-c:a aac',
        '-ac 2',
        '-b:a 192k',
        '-map 0:a:0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      
      this.ffmpegCommand.output(path.join(this.outputPath, '/video.m3u8'))
      // console.log(this.inputPath.green)
      // console.log(path.join(this.outputPath, '/video.m3u8').yellow)

      // this.ffmpegCommand.on('stderr', (stderrLine) => {
      //   console.log(stderrLine)
      // })
    
      this.ffmpegCommand.on('end', () => {
        Logger.debug('[Video] Transcoding finished:', this.outputPath)
        try {
          this.completeJob()
        }
        catch (error: any) {
          Logger.error('[Video] E02 Transcoding error:', error)
          this.isFinished = true
          this.isTranscoding = false
          for (const callback of this.onErrorCallbacks) callback(error.message)
        }
      })
      
      this.ffmpegCommand.on('error', (error) => {
        Logger.error('[Video] Transcoding error:', error)
        this.isFinished = true
        this.isTranscoding = false
        for (const callback of this.onErrorCallbacks) callback(error.message)
      })
      
      // ffmpegCommand.run()
      // ffmpegCommand.kill('SIGKILL')
    }
  }

  run() {
    if (this.isTranscoding) return
    if (this.isFinished) {
      for (const callback of this.onFinishedSuccessCallbacks) callback()
      return
    }
    TranscoderQueue.queue.push(this)
    TranscoderQueue.processQueue()
  }

  async transcode() {
    return new Promise<void>(resolve => {
      if (this.isTranscoding) return
      this.isTranscoding = true
      this.onFinishedSuccess(() => resolve)
      this.onError(() => resolve)
      console.log(1)
      if (this.isFinished) {
        this.isTranscoding = false
        for (const callback of this.onFinishedSuccessCallbacks) callback()
        return
      }
      console.log(2)
      fs.mkdirSync(this.outputPath, { recursive: true })
      this.ffmpegCommand?.run()
    })
  }

  kill() {
    this.ffmpegCommand?.kill('SIGKILL')
  }

  // Called when the transcode is finished, with no errors
  onFinishedSuccess(callback: () => void) {
    this.onFinishedSuccessCallbacks.push(callback)
  }

  // Called when an error occurs during transcoding
  onError(callback: (error: string) => void) {
    this.onErrorCallbacks.push(callback)
  }

  // Called when progress is made during transcoding
  onProgress(callback: (percentage: number) => void) {
    this.onProgressCallbacks.push(callback)
  }

  // Get additional info about a completed job
  // Currently only used for getting duration, can be expanded in the future
  private completeJob() {
    const m3u8Path = path.join(this.outputPath, '/video.m3u8')
    if (!fs.existsSync(m3u8Path)) throw new Error('Transcoded files do not exist.')
    const m3u8 = fs.readFileSync(m3u8Path, 'utf8')
    let duration: number = 0
    const lines = m3u8.split('\n')
    for (let i = 0; i < lines.length; i++) {
      // Sample line: #EXTINF:12.345,
      if (lines[i].includes('#EXTINF:')) {
        duration += parseFloat(lines[i].split(':')[1].split(',')[0])
      }
    }

    if (duration <= 0) throw new Error('Failed to get video duration.')
    this.duration = duration
    this.isFinished = true
    for (const callback of this.onFinishedSuccessCallbacks) callback()
  }
}