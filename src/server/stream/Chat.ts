import SocketUtils from '@/server/socket/SocketUtils'
import Player from '@/server/stream/Player'
import { ChatType, Msg } from '@/lib/enums'
import type { ChatMessage } from '@/typings/socket'

export default new (class Chat {
  readonly Type = ChatType

  send(message: ChatMessage) {
    SocketUtils.broadcast(Msg.NewChatMessage, message)
  }

  resyncChanges() {
    Player.broadcastStreamInfo()
  }
})()
