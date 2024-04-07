import { Server, type Socket } from 'socket.io'
import { httpServer } from '@/server/httpServer'
import { AuthRole, SocketEvent } from '@/lib/enums'
import Logger from '@/lib/Logger'
import type { JoinStreamPayload, Client, Viewer, EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'
import { socketEvents } from '@/server/socketEvents'

export const clients: Client[] = []

export let io: Server | null = null

// Socket server must be initialized after Next.js is ready
export function initializeSocketServer() {
  io = new Server(httpServer, {
    maxHttpBufferSize: 50e6 // Max 50MB message size (mainly for uploading bumper videos)
  })

  // Handle socket events
  io.on('connection', (socket) => {
    socket.onAny((eventID, payload) => {
      handleEvent(socket, eventID, payload)
    })

    // 'disconnect' is not included in onAny(), so add it here
    socket.on('disconnect', () => {
      handleEvent(socket, 'disconnect')
    })
  })
}

function handleEvent(socket: Socket, eventID: string, payload?: any) {
  const event = socketEvents[eventID]
  if (!event) return

  const client = clients.find(c => c.socket === socket)
  if (!event.allowUnauthenticated && !client) {
    Logger.warn('Unauthorized socket event', { eventID, payload })
    return
  }

  if (event.adminOnly) {
    if (!client || client.role < AuthRole.Admin) {
      Logger.warn('Unauthorized admin socket event', { eventID, payload })
      return
    }
  }

  event.run(socket, payload)
}