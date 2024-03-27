import { Server, type Socket } from 'socket.io'
import { httpServer } from '@/server/httpServer'
import { SocketEvent } from '@/lib/enums'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import type { JoinStreamPayload, Client, Viewer } from '@/typings/socket'
import Player from '@/stream/Player'
import { ClientPlaylist } from '@/typings/types'

export const clients: Client[] = []

export let io: Server | null = null

// Socket server must be initialized after Next.js is ready
export function initializeSocketServer() {
  io = new Server(httpServer)

  io.on('connection', (socket) => {
    // If client disconnects, remove them from the viewers list and broadcast new list
    socket.on('disconnect', () => {
      const index = clients.findIndex(c => c.socket === socket)
      if (index !== -1) clients.splice(index, 1)
      broadcast(SocketEvent.ViewersList, getViewersList())
    })

    // Message sent from client on first connection, adds them to the viewers list
    socket.on(SocketEvent.JoinStream, (payload: JoinStreamPayload) => {
      const authRole = authRoleFromPassword(payload.password)
      if (authRole === null) return

      clients.push({
        socket: socket,
        secret: payload.secret,
        username: payload.username,
        role: authRole
      })
      broadcast(SocketEvent.ViewersList, getViewersList())

      const streamInfo = Player.getStreamInfo()
      socket.emit(SocketEvent.StreamInfo, streamInfo)
    })

    // Client changed their username, update the viewers list
    socket.on(SocketEvent.ChangeUsername, (newUsername: string) => {
      // console.log('Viewer changed username:', newUsername)
      const client = clients.find(c => c.socket === socket)
      if (client) client.username = newUsername
      broadcast(SocketEvent.ViewersList, getViewersList())
    })

    // Admin stuff
    socket.on(SocketEvent.AdminRequestFileTree, async () => {
      const tree = await Player.getVideosFileTree()
      socket.emit(SocketEvent.AdminRequestFileTree, tree)
    })

    socket.on(SocketEvent.AdminRequestPlaylists, async () => {
      const playlists: ClientPlaylist[] = Player.playlists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        videoPaths: playlist.videos.map(video => video.path)
      }))
      socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
    })
  })
}

// Send message to all viewers
export function broadcast(event: SocketEvent, payload: any) {
  clients.forEach(client => {
    client.socket.emit(event, payload)
  })
}

export function broadcastViewersList() {
  broadcast(SocketEvent.ViewersList, getViewersList())
}

// Create viewers list object from clients array
function getViewersList(): Viewer[] {
  const viewers: Viewer[] = []
  for (const client of clients) {
    viewers.push({
      socketID: client.socket.id,
      username: client.username,
      role: client.role
    })
  }
  return viewers
}

export function broadcastStreamInfo() {
  const info = Player.getStreamInfo()
  broadcast(SocketEvent.StreamInfo, info)
}