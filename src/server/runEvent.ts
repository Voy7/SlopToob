import { ServerEvent } from '@/lib/enums'
import Logger from '@/lib/Logger'
import { clients } from '@/server/socket'
import { SocketEvent } from '@/lib/enums'
import parseBody from '@/lib/parseBody'
import SocketUtils from '@/lib/SocketUtils'
import type { IncomingMessage, ServerResponse } from 'http'
import type { ChatMessage } from '@/typings/socket'

export default async function runEvent(event: ServerEvent, req: IncomingMessage, res: ServerResponse) {
  if (event === ServerEvent.ChangeUsername) {
    const body = await parseBody<{ username: string, socketSecret: string }>(req)

    if (!body) throw new Error('Invalid body')
    const { username, socketSecret } = body

    // Update username in clients list and broadcast new viewers list
    const client = clients.find(c => c.secret === socketSecret)
    if (client) client.username = username
    SocketUtils.broadcastViewersList()

    return res.end(JSON.stringify({ success: true }))
  }

  if (event === ServerEvent.SendChatMessage) {
    const body = await parseBody<{ message: string, socketSecret: string }>(req)

    if (!body) throw new Error('Invalid body')
    const { message, socketSecret } = body

    if (message.length === 0) throw new Error('Message cannot be empty.')
    if (message.length > 120) throw new Error('Max message length is 120 characters.')

    const client = clients.find(c => c.secret === socketSecret)
    if (!client) throw new Error('Invalid socket secret')

    const chatMessage: ChatMessage = {
      username: client.username,
      role: client.role,
      message: message
    }
    SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)

    return res.end(JSON.stringify({ success: true }))
  }
}