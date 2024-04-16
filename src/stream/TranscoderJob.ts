import fs from 'fs'
import path from 'path'
import ffmpeg from '@/lib/ffmpeg'
import Logger from '@/lib/Logger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import TranscoderQueue from '@/stream/TranscoderQueue'

// Represents a transcoding job
export default class TranscoderJob {
  isReady: boolean = false
  isTranscoding: boolean = false
  duration: number = 0
  progressPercentage: number = 0
  private ffmpegCommand: FfmpegCommand | null = null
  private onStreamableReadyCallbacks: Array<() => void> = []
  private onTranscodeFinishedCallbacks: Array<() => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onProgressCallbacks: Array<(percentage: number) => void> = []
  private onFfmpegCmdReadyCallback: (() => void) | null = null
  private ffmpegCmdReady: boolean = false

  // Running completeJob() will see if the transcoded files already exist, if so the job is already done
  // If an error is thrown, that means we need to start transcoding logic
  constructor(readonly inputPath: string, readonly outputPath: string) {
    (async () => {
      try { await this.completeJob() }
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
      
        this.ffmpegCommand.on('end', async () => {
          Logger.debug('[Video] Transcoding funny finished:', this.outputPath)
          this.isTranscoding = false
          try { await this.completeJob() }
          catch (error: any) {
            Logger.error('[Video] E03 Transcoding error:', error)
            this.isReady = true
            this.isTranscoding = false
            for (const callback of this.onErrorCallbacks) callback(error.message)
          }
        })
        
        // If ffmpeg error occurs, Note this gets called after 'end' event
        this.ffmpegCommand.on('error', (error) => {
          Logger.error('[Video] Transcoding error:', error)
          this.isReady = true
          this.isTranscoding = false
          for (const callback of this.onErrorCallbacks) callback(error.message)
        })
        
        // When first segment is created
        this.ffmpegCommand.on('progress', async (progress) => {
          if (!this.isReady) {
            // this.isReady = true
            try { await this.completeJob() }
            catch (error: any) {
              // Logger.error('[Video] E02 Transcoding error:', error)
              // this.isReady = true
              // this.isTranscoding = false
              // for (const callback of this.onErrorCallbacks) callback(error.message)
            }
          }
        })

        // Ffmpeg command created/ready
        this.ffmpegCmdReady = true
        if (this.onFfmpegCmdReadyCallback) this.onFfmpegCmdReadyCallback()
      }
    })()
  }

  // Add this job to the queue
  activate() {
    if (this.isReady) {
      for (const callback of this.onStreamableReadyCallbacks) callback()
      return
    }
    TranscoderQueue.queue.push(this)
    TranscoderQueue.processQueue()
  }

  // Actually start the transcoding process
  // Should only be called once
  async transcode(): Promise<void>{
    if (this.isReady) return

    return new Promise<void>((resolve: any) => {
      this.onStreamableReady(resolve)
      this.onError(resolve)

      if (this.isTranscoding) return
      this.isTranscoding = true
      
      this.onFfmpegCmdReady(() => {
        fs.mkdirSync(this.outputPath, { recursive: true })
        this.ffmpegCommand?.run()
      })
    })
  }

  kill() {
    this.ffmpegCommand?.kill('SIGKILL')
  }

  // Called when the video has been transcoded enough to start playing while the rest is still transcoding
  onStreamableReady(callback: () => void) {
    this.onStreamableReadyCallbacks.push(callback)
  }

  // Called when the transcode is fully finished, with no errors
  onTranscodeFinished(callback: () => void) {
    this.onTranscodeFinishedCallbacks.push(callback)
  }

  // Called if an error occurs during transcoding, no other callbacks will be called
  onError(callback: (error: string) => void) {
    this.onErrorCallbacks.push(callback)
  }

  // Called when progress is made during transcoding
  onProgress(callback: (percentage: number) => void) {
    this.onProgressCallbacks.push(callback)
  }

  // Private callback for when ffmpeg command has been created
  private onFfmpegCmdReady(callback: () => void) {
    if (this.ffmpegCmdReady) callback()
    else this.onFfmpegCmdReadyCallback = callback
  }

  // Get additional info about a completed job
  // Currently only used for getting duration, can be expanded in the future
  private async completeJob() {
    if (this.isReady) return
    
    const m3u8Path = path.join(this.outputPath, '/video.m3u8')
    if (!fs.existsSync(m3u8Path)) throw new Error('Transcoded files do not exist.')

      // Should only run on first initialization
      if (!this.isTranscoding) {
        // If the .m3u8 file doesn't contain '#EXT-X-ENDLIST', then the transcode is incomplete
        // So, delete the directory and start over
        const m3u8Content = fs.readFileSync(m3u8Path, 'utf8')
        if (!m3u8Content.includes('#EXT-X-ENDLIST')) {
          fs.rmSync(this.outputPath, { recursive: true, force: true })
          throw new Error('Partial transcoded files existed, deleted and starting over.')
        }
      }
    
    // Use ffprobe to get the duration of the video
    await new Promise<void>((resolve, reject) => {
      ffmpeg.ffprobe(this.inputPath, (error, metadata) => {
        if (error) reject('Failed to get video duration.')
        if (!metadata?.format?.duration) reject('Failed to get video metadata duration value.')
        this.duration = metadata.format.duration as number
        this.isReady = true
        resolve()
      })
    })
    for (const callback of this.onStreamableReadyCallbacks) callback()
  }
}