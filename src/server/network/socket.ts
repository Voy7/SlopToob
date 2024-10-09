import { Server, type Socket } from 'socket.io'
import { httpServer } from '@/server/network/httpServer'
import Logger from '@/server/core/Logger'
import Checklist from '@/server/core/Checklist'
import Events from '@/server/network/Events'
import Settings, { settingsList } from '@/server/core/Settings'
import { socketClients } from '@/server/network/socketClients'
import { AuthRole } from '@/shared/enums'

let io: Server | null = null

// Socket server must be initialized after Next.js is ready
export function initializeSocketServer() {
  io = new Server(httpServer, {
    transports: ['websocket'],
    maxHttpBufferSize: 100e6 // Max size of HTTP buffer (100MB)
  })

  Checklist.pass('socketServerReady', 'Web Socket Server Ready.')

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
  const event = Events.get(eventID)
  if (!event) return

  const client = socketClients.find((c) => c.socket === socket)
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
async function handleSettingEvent(
  socket: Socket,
  settingKey: keyof typeof settingsList,
  payload: any
) {
  const setting = settingsList[settingKey]
  if (!setting) return

  const client = socketClients.find((c) => c.socket === socket)
  if (!client || client.role < AuthRole.Admin) {
    Logger.warn('Unauthorized setting event', { settingKey, value: payload })
    return
  }

  // If value is undefined, they are just requesting the current value
  if (payload === undefined) {
    const clientValue =
      'clientValue' in setting ? await setting.clientValue() : Settings[settingKey]
    // console.log(setting, clientValue)
    socket.emit(`setting.${settingKey}`, clientValue)
    return
  }

  await Settings.set(settingKey, payload, client)
}
