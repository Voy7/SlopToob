import Player from '@/stream/Player'
import { clients } from '@/server/socket'
import { SocketEvent, AuthRole } from '@/lib/enums'
import type { Viewer } from '@/typings/socket'

// Server-side socket utilities
export default new class SocketUtils {
  broadcast(event: SocketEvent, payload: any) {
    for (const client of clients) {
      client.socket.emit(event, payload)
    }
  }

  broadcastAdmin(event: SocketEvent, payload: any) {
    try {
      for (const client of clients) {
        if (client.role < AuthRole.Admin) continue
        client.socket.emit(event, payload)
      }
    } catch (error) {}
  }

  broadcastViewersList() {
    this.broadcast(SocketEvent.ViewersList, this.getViewersList())
  }

  getViewersList(): Viewer[] {
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

  broadcastStreamInfo() {
    const info = Player.getStreamInfo()
    this.broadcast(SocketEvent.StreamInfo, info)
  }
}