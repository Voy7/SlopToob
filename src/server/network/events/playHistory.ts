import Events from '@/server/network/Events'
import PlayHistory from '@/server/stream/PlayHistory'

// Admin clears history
Events.add(Events.Msg.AdminDeleteHistory, {
  adminOnly: true,
  run: async (socket) => {
    await PlayHistory.clearAllHistory()
  }
})
