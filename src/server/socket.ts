import { Server, type Socket } from 'socket.io'
import { httpServer } from '@/server/httpServer'
import { AuthRole, Msg } from '@/lib/enums'
import Logger from '@/lib/Logger'
import type { JoinStreamPayload, SocketClient, Viewer, EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'
import { socketEvents } from '@/server/socketEvents'
import Settings, { settingsList } from '@/stream/Settings'
import { socketClients } from '@/server/socketClients'

let io: Server | null = null

// Socket server must be initialized after Next.js is ready
export function initializeSocketServer() {
  io = new Server(httpServer, {
    maxHttpBufferSize: 50e6 // Max 50MB message size (mainly for uploading bumper videos)
  })

  // Handle socket events
  io.on('connection', (socket) => {
    socket.onAny((eventID, payload) => {
      if (eventID?.startsWith('setting.')) {
        const settingKey = eventID.split('.')[1] as keyof typeof settingsList
        handleSettingEvent(socket, settingKey, payload)
        return
      }
      handleSocketEvent(socket, eventID, payload)
    })

    // 'disconnect' is not included in onAny(), so add it here
    socket.on('disconnect', () => {
      handleSocketEvent(socket, 'disconnect')
    })
  })
}

// Handle socket events (from socketEvents)
function handleSocketEvent(socket: Socket, eventID: string, payload?: any) {
  const event = socketEvents[eventID]
  if (!event) return

  const client = socketClients.find(c => c.socket === socket)
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

// Handle getting & setting settings from the client
async function handleSettingEvent(socket: Socket, settingKey: keyof typeof settingsList, payload: any) {
  const setting = settingsList[settingKey]
  if (!setting) return

  const client = socketClients.find(c => c.socket === socket)
  if (!client || client.role < AuthRole.Admin) {
    Logger.warn('Unauthorized setting event', { settingKey, value: payload })
    return
  }
  
  // If value is undefined, they are just requesting the current value
  if (payload === undefined) {
    const clientValue = ('clientValue' in setting) ? await setting.clientValue() : Settings.getSettings()[settingKey]
    // console.log(setting, clientValue)
    socket.emit(`setting.${settingKey}`, clientValue)
    return
  }

  await Settings.setSetting(settingKey, payload)
}