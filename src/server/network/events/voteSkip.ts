import Events from '@/server/network/Events'
import VoteSkipHandler from '@/server/stream/VoteSkipHandler'

// User votes to skip current video
Events.add(Events.Msg.VoteSkipAdd, {
  run: (socket) => {
    VoteSkipHandler.addVote(socket.id)
    socket.emit(Events.Msg.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
  }
})

// User removes their vote to skip current video
Events.add(Events.Msg.VoteSkipRemove, {
  run: (socket) => {
    VoteSkipHandler.removeVote(socket.id)
    socket.emit(Events.Msg.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
  }
})
