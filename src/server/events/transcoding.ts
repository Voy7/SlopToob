import Events from '@/server/socket/Events'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import CacheHandler from '@/server/stream/CacheHandler'

// // Refresh all transcoding jobs, and delete all videos cache
Events.add(Events.Msg.AdminApplyTranscoderChanges, {
  adminOnly: true,
  run: () => {
    TranscoderQueue.refreshAllActiveJobs()
    CacheHandler.deleteAll('videos')
    CacheHandler.deleteAll('bumpers')
  }
})
