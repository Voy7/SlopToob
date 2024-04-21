import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import Logger from '@/lib/Logger'
import type { FfmpegCommand } from 'fluent-ffmpeg'
import TranscoderJob from '@/stream/TranscoderJob'
import { TranscodeClientVideo } from '@/typings/socket'
import SocketUtils from '@/lib/SocketUtils'
import { JobState, SocketEvent } from '@/lib/enums'
import type Video from '@/stream/Video'

const MAX_TRANSCODING_JOBS = 2

// Handles all transcoding operations
// The reason why this logic is not in the Video class is because there can be
// multiple of the same video, videos that are deleted while transcoding, etc.
// Also allows for a queue system to prevent multiple transcodes of the same video
export default new class TranscoderQueue {
  jobs: TranscoderJob[] = []

  // Create a new job if it doesn't exist, otherwise return the existing job
  newJob(video: Video): TranscoderJob {
    const existingJob = this.jobs.find(item => item.video.inputPath === video.inputPath)
    if (existingJob) {
      existingJob.videos.push(video)
      return existingJob
    }
    const job = new TranscoderJob(video)
    this.jobs.push(job)
    return job
  }

  async processQueue() {
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, this.clientTranscodeList)
    const transcodingJobs = this.jobs.filter(item => item.state === JobState.Transcoding)
    // console.log(`job1 `, transcodingJobs)
    if (transcodingJobs.length >= MAX_TRANSCODING_JOBS) return

    const nextJob = this.jobs.find(item => item.state === JobState.AwaitingTranscode)
    if (!nextJob) return

    await nextJob.transcode()
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, this.clientTranscodeList)

    // const nextJobIndex = this.jobs.findIndex(item => item === nextJob)
    // this.jobs.splice(nextJobIndex, 1)
    this.processQueue()
  }

  get clientTranscodeList(): TranscodeClientVideo[] {
    const jobs: TranscodeClientVideo[] = []
    for (const job of this.jobs) {
      // if (job.state !== JobState.AwaitingTranscode && job.state !== JobState.Transcoding) continue
      jobs.push({
        id: job.id,
        state: job.state,
        name: job.video.name,
        inputPath: job.video.inputPath,
        progressPercentage: job.progressPercentage
      })
    }
    return jobs
  }
}