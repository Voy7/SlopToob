import Logger from '@/server/Logger'
import Settings from '@/stream/Settings'
import TranscoderJob from '@/stream/TranscoderJob'
import SocketUtils from '@/lib/SocketUtils'
import { JobState, Msg } from '@/lib/enums'
import type { TranscodeClientVideo } from '@/typings/socket'
import type Video from '@/stream/Video'

// Handles all transcoding operations
// The reason why this logic is not in the Video class is because there can be
// multiple of the same video, videos that are deleted while transcoding, etc.
// Also allows for a queue system to prevent multiple transcodes of the same video
export default new (class TranscoderQueue {
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

  get clientTranscodeList(): TranscodeClientVideo[] {
    const list: TranscodeClientVideo[] = []
    for (const job of this.jobs) {
      // if (job.state !== JobState.AwaitingTranscode && job.state !== JobState.Transcoding) continue
      list.push({
        id: job.id,
        state: job.state,
        name: job.video.name,
        inputPath: job.video.inputPath
      })
    }
    return list
  }
})()
