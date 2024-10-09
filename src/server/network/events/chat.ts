import Events from '@/server/network/Events'
import Settings from '@/server/core/Settings'
import Chat from '@/server/stream/Chat'
import { socketClients } from '@/server/network/socketClients'

// Client sent a chat message, respond with string if error
Events.add(Events.Msg.SendChatMessage, {
  run: (socket, message: unknown) => {
    try {
      if (typeof message !== 'string') throw new Error('Invalid payload.')

      message = message.trim() // Remove leading/trailing whitespace

      if (typeof message !== 'string' || message.length === 0)
        throw new Error('Message cannot be empty.')
      if (message.length > Settings.chatMaxLength)
        throw new Error(`Max message length is ${Settings.chatMaxLength} characters.`)

      const client = socketClients.find((c) => c.socket === socket)
      if (!client) throw new Error('Socket not found.') // Should never happen

      Chat.send({
        type: Chat.Type.UserChat,
        username: client.username,
        role: client.role,
        image: client.image,
        message: message
      })
    } catch (error: any) {
      socket.emit(Events.Msg.SendChatMessage, error.message)
    }
  }
})
