import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import Logger from '@/lib/Logger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import TranscoderJob from '@/stream/TranscoderJob'
import { TranscodeClientVideo } from '@/typings/socket'
import SocketUtils from '@/lib/SocketUtils'
import { SocketEvent } from '@/lib/enums'

const MAX_TRANSCODING_JOBS = 2

type QueueItem = {
  job: TranscoderJob,
  callback: Function
}

// Handles all transcoding operations
// The reason why this logic is not in the Video class is because there can be
// multiple of the same video, videos that are deleted while transcoding, etc.
// Also allows for a queue system to prevent multiple transcodes of the same video
export default new class TranscoderQueue {
  queue: TranscoderJob[] = []

  // Create a new job if it doesn't exist, otherwise return the existing job
  newJob(inputPath: string, outputPath: string): TranscoderJob {
    const existingJob = this.queue.find(item => item.inputPath === inputPath)
    if (existingJob) {
      console.log('RETURNING EXISTING JOB - ', inputPath)
      return existingJob
    }
    const job = new TranscoderJob(inputPath, outputPath)
    // this.queue.push(job)
    // this.processQueue()
    return job
  }

  async processQueue() {
    // console.log('transcode queue:', this.queue)
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, this.clientTranscodeList)
    const transcodingJobs = this.queue.filter(item => item.isTranscoding)
    if (transcodingJobs.length >= MAX_TRANSCODING_JOBS) return

    const nextJob = this.queue.find(item => !item.isTranscoding)
    if (!nextJob) return

    await nextJob.transcode()
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, this.clientTranscodeList)

    const nextJobIndex = this.queue.findIndex(item => item === nextJob)
    this.queue.splice(nextJobIndex, 1)
    this.processQueue()
  }

  get clientTranscodeList(): TranscodeClientVideo[] {
    return this.queue.map(job => ({
      name: job.inputPath.split('/').pop() || 'Name WIP',
      inputPath: job.inputPath,
      isTranscoding: job.isTranscoding,
      progressPercentage: job.progressPercentage
    }))
  }
}