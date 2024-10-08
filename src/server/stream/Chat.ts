import Settings from '@/server/core/Settings'
import Logger from '@/server/core/Logger'
import SocketUtils from '@/server/network/SocketUtils'
import Player from '@/server/stream/Player'
import { socketClients } from '@/server/network/socketClients'
import { ChatType, Msg } from '@/shared/enums'
import type { ChatMessage, SocketClient } from '@/typings/socket'

export default new (class Chat {
  readonly Type = ChatType

  send(message: ChatMessage, omitClient?: SocketClient) {
    if (omitClient) {
      for (const client of socketClients) {
        if (client === omitClient) continue
        client.socket.emit(Msg.NewChatMessage, message)
      }
    } else SocketUtils.broadcast(Msg.NewChatMessage, message)
    if (!Settings.showChatMessagesInConsole) return
    if (message.type === ChatType.UserChat) {
      Logger.chatMessage(`${message.username}: ${message.message}`)
      return
    }
    Logger.chatMessage(`(Event) ${message.message}`)
  }

  resyncChanges() {
    Player.broadcastStreamInfo()
  }
})()
