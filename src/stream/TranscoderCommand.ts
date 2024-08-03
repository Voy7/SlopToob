import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import ffmpeg, { TRANSCODE_ARGS } from '@/lib/ffmpeg'
import parseTimestamp from '@/lib/parseTimestamp'
import timestampToSeconds from '@/lib/timestampToSeconds'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { ProgressInfo } from '@/typings/types'
import type TransCoderJob from '@/stream/TranscoderJob'

export default class TranscoderCommand {
  readonly job: TransCoderJob
  private ffmpegCommand: FfmpegCommand

  constructor(job: TransCoderJob) {
    this.job = job
    this.ffmpegCommand = ffmpeg(job.video.inputPath).addOptions(TRANSCODE_ARGS)
    this.ffmpegCommand.inputOptions([`-ss ${job.seekSeconds}`])
    this.ffmpegCommand.output(path.join(job.video.outputPath, '/video.m3u8'))
    // Print raw command
    console.log(this.ffmpegCommand._getArguments().join(' '))
  }

  run() {
    this.ffmpegCommand.run()
  }

  kill() {
    this.ffmpegCommand.kill('SIGKILL')
  }

  onEnd(callback: () => void) {
    this.ffmpegCommand.on('end', callback)
  }

  onError(callback: (err: Error) => void) {
    this.ffmpegCommand.on('error', callback)
  }

  // Output progress info every second
  onProgress(callback: (progress: ProgressInfo) => void) {
    let availableSeconds = 0

    fs.watchFile(this.job.m3u8Path, { interval: 1000 }, async () => {
      try {
        // Read m3u8 file to get available seconds (add all #EXTINF: values)
        const text = await fsAsync.readFile(this.job.m3u8Path, 'utf8')
        // Line structure: #EXTINF:10.000,
        const matches = text.match(/#EXTINF:(\d+\.\d+),/g)
        availableSeconds =
          matches?.reduce((acc, val) => acc + parseFloat(val.split(':')[1]), 0) || 0
      } catch {}
    })

    this.ffmpegCommand.on('progress', (progress) => {
      progress.timemark = progress.timemark?.split('.')[0] || '00:00:00'
      callback({
        percent: progress.percent || 0,
        processedSeconds: timestampToSeconds(progress.timemark) || 0,
        processedTimestamp: progress.timemark,
        availableSeconds: availableSeconds,
        availableTimestamp: parseTimestamp(availableSeconds),
        fpsRate: progress.currentFps || 0,
        frames: progress.frames || 0
      })
    })
  }

  onFirstChunk(callback: () => void) {
    const checker = () => {
      if (!fs.existsSync(this.job.m3u8Path)) return
      this.ffmpegCommand.removeListener('progress', checker)
      callback()
    }
    this.ffmpegCommand.on('progress', checker)
  }
}
