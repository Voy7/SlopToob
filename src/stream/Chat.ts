import SocketUtils from '@/lib/SocketUtils'
import Player from '@/stream/Player'
import { ChatType, Msg } from '@/lib/enums'
import type { ChatMessage } from '@/typings/socket'

export default new class Chat {
  readonly Type = ChatType

  send(message: ChatMessage) {
    SocketUtils.broadcast(Msg.NewChatMessage, message)
  }

  resyncChanges() {
    SocketUtils.broadcast(Msg.StreamInfo, Player.clientStreamInfo)
  }
}