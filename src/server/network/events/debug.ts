import Events from '@/server/network/Events'
import Logger from '@/server/core/Logger'
import Player from '@/server/stream/Player'
import TranscoderQueue from '@/server/stream/TranscoderQueue'

Events.add(Events.Msg.AdminDebugJob, {
  adminOnly: true,
  run: (socket, jobID: string) => {
    const job = TranscoderQueue.jobs.find((j) => j.id === jobID)
    if (job) Logger.debug(job)
  }
})

Events.add(Events.Msg.AdminDebugVideo, {
  adminOnly: true,
  run: (socket, videoID: string) => {
    const video = Player.playing || Player.queue.find((v) => v.id === videoID)
    if (video) Logger.debug(video)
  }
})
