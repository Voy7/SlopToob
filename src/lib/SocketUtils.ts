import { socketClients } from '@/server/socketClients'
import { Msg, AuthRole } from '@/lib/enums'
import type { Viewer } from '@/typings/socket'

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
    for (const client of socketClients) {
      viewers.push({
        socketID: client.socket.id,
        username: client.username,
        role: client.role
      })
    }
    this.broadcast(Msg.ViewersList, viewers)
  }
}