import Settings from '@/server/Settings'
import Logger from '@/server/Logger'
import SocketUtils from '@/server/socket/SocketUtils'
import Player from '@/server/stream/Player'
import { ChatType, Msg } from '@/lib/enums'
import type { ChatMessage } from '@/typings/socket'

export default new (class Chat {
  readonly Type = ChatType

  send(message: ChatMessage) {
    SocketUtils.broadcast(Msg.NewChatMessage, message)
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
