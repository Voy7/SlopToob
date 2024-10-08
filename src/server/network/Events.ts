import fs from 'fs'
import path from 'path'
import { Msg } from '@/shared/enums'
import type { Socket } from 'socket.io'

type EventOptions = {
  allowUnauthenticated?: boolean // Allow unauthenticated users to run this event (default: false)
  adminOnly?: boolean // Only allow admin users to run this event (default: false)
  run: (socket: Socket, payload: any) => void
}

class SocketEvents {
  readonly Msg = Msg

  private events: Map<string, EventOptions> = new Map()

  add(eventID: Msg, options: EventOptions) {
    this.events.set(eventID, options)
  }

  get(eventID: string): EventOptions | null {
    return this.events.get(eventID) || null
  }
}

export default new SocketEvents()

// Import all files from /events/ folder to register events
const files = fs.readdirSync(path.join(__dirname, './events/'))
for (const file of files) {
  if (!file.endsWith('.ts')) continue
  require(path.join(__dirname, '../network/events/', file))
}
