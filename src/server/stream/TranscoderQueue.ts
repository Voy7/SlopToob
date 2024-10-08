import parseTimestamp from '@/shared/parseTimestamp'
import Logger from '@/server/core/Logger'
import Settings from '@/server/core/Settings'
import TranscoderJob from '@/server/stream/TranscoderJob'
import SocketUtils from '@/server/network/SocketUtils'
import Thumbnails from '@/server/stream/Thumbnails'
import { JobState, Msg } from '@/shared/enums'
import type { TranscodeClientVideo } from '@/typings/socket'
import type Video from '@/server/stream/Video'

// Handles all transcoding operations, singleton
// The reason why this logic is not in the Video class is because there can be
// multiple of the same video, videos that are deleted while transcoding, etc.
// Also allows for a queue system to prevent multiple jobs of the same video
class TranscoderQueue {
  jobs: TranscoderJob[] = []

  // Create a new job if it doesn't exist, otherwise return the existing job
  newJob(video: Video): TranscoderJob {
    const existingJob = this.jobs.find((item) => item.video.inputPath === video.inputPath)
    if (existingJob) {
      existingJob.videos.push(video)
      return existingJob
    }
    const job = new TranscoderJob(video)
    this.jobs.push(job)
    return job
  }

  async processQueue() {
    SocketUtils.broadcastAdmin(Msg.AdminTranscodeQueueList, this.clientTranscodeList)
    const transcodingJobs = this.jobs.filter((item) => item.state === JobState.Transcoding)
    if (transcodingJobs.length >= Settings.maxTranscodingJobs) return

    const nextJob = this.jobs.find((item) => item.state === JobState.AwaitingTranscode)
    if (!nextJob) return

    await nextJob.transcode()

    this.processQueue()
  }

  // Reset all active jobs, used for applying new transcoding settings
  refreshAllActiveJobs() {
    for (const job of this.jobs) job.resetTranscode()
  }

  get clientTranscodeList(): TranscodeClientVideo[] {
    const list: TranscodeClientVideo[] = []
    for (const job of this.jobs) {
      const item: TranscodeClientVideo = {
        id: job.id,
        state: job.state,
        name: job.video.name,
        inputPath: job.video.inputPath,
        thumbnailURL: Thumbnails.getURL(job.video.inputPath),
        isUsingCache: job.isUsingCache,
        targetSection: `${parseTimestamp(job.transcodedStartSeconds)} - ${parseTimestamp(job.duration)}`,
        totalSeconds: job.duration,
        availableSeconds: job.availableSeconds,
        averageFpsRate: job.lastProgressInfo?.averageFpsRate || 0,
        frames: job.lastProgressInfo?.frames || 0,
        error: job.error
      }
      if (job.state === JobState.Transcoding) {
        item.currentFpsRate = job.lastProgressInfo?.currentFpsRate || 0
      }
      list.push(item)
    }
    return list
  }
}

export default new TranscoderQueue()
