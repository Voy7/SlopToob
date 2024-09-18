import { socketClients } from '@/server/socket/socketClients'
import { Msg, AuthRole } from '@/lib/enums'
import type { Viewer, ClientRichUser, SocketClient } from '@/typings/socket'

// Server-side socket utilities
export default class SocketUtils {
  // Broadcast message to all connected (and authenticated) clients
  static broadcast(event: Msg, payload: any) {
    for (const client of socketClients) {
      client.socket.emit(event, payload)
    }
  }

  // Broadcast message to all admin clients
  static broadcastAdmin(event: Msg, payload: any) {
    for (const client of socketClients) {
      if (client.role < AuthRole.Admin) continue
      client.socket.emit(event, payload)
    }
  }

  // Broadcast list of viewers, derived from socketClients
  static broadcastViewersList() {
    const viewers: Viewer[] = []
    const richUsers: ClientRichUser[] = []
    for (const client of socketClients) {
      richUsers.push({
        socketID: client.socket.id,
        username: client.username,
        image: client.image,
        role: client.role,
        isWatching: client.isWatching
      })
      if (!client.isWatching) continue
      viewers.push({
        username: client.username,
        image: client.image,
        role: client.role
      })
    }
    richUsers.sort((a, b) => (a.isWatching === b.isWatching ? 0 : a.isWatching ? 1 : -1))
    this.broadcast(Msg.ViewersList, viewers)
    this.broadcastAdmin(Msg.AdminRichUsers, richUsers)
  }

  static get clientRichUsers(): ClientRichUser[] {
    const richUsers: ClientRichUser[] = []
    for (const client of socketClients) {
      richUsers.push({
        socketID: client.socket.id,
        username: client.username,
        image: client.image,
        role: client.role,
        isWatching: client.isWatching
      })
    }
    richUsers.sort((a, b) => (a.isWatching === b.isWatching ? 0 : a.isWatching ? 1 : -1))
    return richUsers
  }

  static get watchingClients(): SocketClient[] {
    return socketClients.filter((client) => client.isWatching)
  }
}
