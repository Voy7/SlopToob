import Events from '@/server/socket/Events'
import TranscoderQueue from '@/server/stream/TranscoderQueue'

Events.add(Events.Msg.AdminTerminateJob, {
  adminOnly: true,
  run: (socket, jobID: string) => {
    const job = TranscoderQueue.jobs.find((j) => j.id === jobID)
    if (job) job.forceKill()
  }
})
