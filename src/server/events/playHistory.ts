import Events from '@/server/socket/Events'
import PlayHistory from '@/server/stream/PlayHistory'

// Admin clears history
Events.add(Events.Msg.AdminDeleteHistory, {
  adminOnly: true,
  run: async (socket) => {
    await PlayHistory.clearAllHistory()
  }
})
