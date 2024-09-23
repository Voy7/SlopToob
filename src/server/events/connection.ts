import Events from '@/server/socket/Events'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import generateSecret from '@/lib/generateSecret'
import isNicknameValid from '@/lib/isNicknameValid'
import Player from '@/server/stream/Player'
import Settings from '@/server/Settings'
import Chat from '@/server/stream/Chat'
import Schedule from '@/server/stream/Schedule'
import VoteSkipHandler from '@/server/stream/VoteSkipHandler'
import SocketUtils from '@/server/socket/SocketUtils'
import { socketClients } from '@/server/socket/socketClients'
import type { AuthenticatePayload } from '@/typings/socket'

// If client disconnects, remove them from the viewers list and broadcast new list
Events.add(Events.Msg.Disconnect, {
  run: (socket) => {
    const existingClient = socketClients.find((c) => c.socket === socket)
    if (!existingClient) return
    socketClients.splice(socketClients.indexOf(existingClient), 1)

    if (!existingClient.isWatching) {
      SocketUtils.broadcastAdmin(Events.Msg.AdminRichUsers, SocketUtils.clientRichUsers)
      return
    }

    VoteSkipHandler.removeVote(socket.id)
    VoteSkipHandler.resyncChanges()
    SocketUtils.broadcastViewersList()

    // Pause stream if 'pause when inactive' criteria is met
    if (Settings.pauseWhenInactive && socketClients.length <= 0) Player.playing?.pause(false)

    if (!Settings.sendLeftStream) return
    Chat.send({
      type: Chat.Type.Left,
      message: `${existingClient.username} left the stream.`
    })
  }
})

// First connection, only authenticates user, not in the stream / viewers list yet
Events.add(Events.Msg.Authenticate, {
  allowUnauthenticated: true,
  run: (socket, payload: AuthenticatePayload) => {
    const existingClient = socketClients.find((c) => c.socket === socket)
    if (existingClient) return

    const authRole = authRoleFromPassword(payload.password)
    if (authRole === null) return

    socketClients.push({
      socket: socket,
      username: isNicknameValid(payload.username) === true ? payload.username : 'Anonymous',
      role: authRole,
      image: `/api/avatar/${generateSecret()}`,
      isWatching: false
    })

    socket.emit(Events.Msg.Authenticate, true)

    SocketUtils.broadcastAdmin(Events.Msg.AdminRichUsers, SocketUtils.clientRichUsers)
  }
})

// Subscribe to get stream info updates, show on viewers list, etc.
Events.add(Events.Msg.JoinStream, {
  run: (socket) => {
    const client = socketClients.find((c) => c.socket === socket)
    if (!client || client.isWatching) return

    client.isWatching = true

    VoteSkipHandler.resyncChanges()
    SocketUtils.broadcastViewersList()

    socket.emit(Events.Msg.StreamInfo, Player.clientStreamInfo)
    socket.emit(Events.Msg.ScheduleDisplay, Schedule.clientScheduleDisplay)
    socket.emit(Events.Msg.JoinStream, true)

    // Unpause stream if 'pause when inactive' was active
    if (Settings.pauseWhenInactive && !Settings.streamIsPaused) Player.unpause()

    if (!Settings.sendJoinedStream) return
    Chat.send(
      {
        type: Chat.Type.Joined,
        message: `${client.username} joined the stream.`
      },
      client
    )
  }
})

// Admin kicks user
Events.add(Events.Msg.AdminKickUser, {
  adminOnly: true,
  run: (socket, socketID: unknown) => {
    const client = socketClients.find((c) => c.socket.id === socketID)
    if (client) client.socket.disconnect()
  }
})
