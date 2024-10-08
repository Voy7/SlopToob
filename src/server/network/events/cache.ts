import Events from '@/server/network/Events'
import CacheHandler from '@/server/stream/CacheHandler'

// Admin deletes a cache
Events.add(Events.Msg.AdminDeleteCache, {
  adminOnly: true,
  run: async (socket, cacheID: unknown) => {
    if (!CacheHandler.isCacheID(cacheID)) return
    CacheHandler.deleteAll(cacheID)
  }
})
