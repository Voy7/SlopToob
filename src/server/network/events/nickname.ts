import Events from '@/server/network/Events'
import isNicknameValid from '@/server/utils/isNicknameValid'
import Settings from '@/server/core/Settings'
import Chat from '@/server/stream/Chat'
import SocketUtils from '@/server/network/SocketUtils'
import { socketClients } from '@/server/network/socketClients'

// Client changed their nickname
// Respond true if successful, string if error
Events.add(Events.Msg.ChangeNickname, {
  run: (socket, newName: unknown) => {
    try {
      if (typeof newName !== 'string') throw new Error('Invalid payload.')

      const isValid = isNicknameValid(newName)
      if (typeof isValid === 'string') throw new Error(isValid)

      const client = socketClients.find((c) => c.socket === socket)
      if (!client) throw new Error('Socket not found.') // Should never happen

      const oldName = client.username
      client.username = newName

      socket.emit(Events.Msg.ChangeNickname, true)
      SocketUtils.broadcastViewersList()

      if (!Settings.sendChangedNickname) return
      Chat.send({
        type: Chat.Type.NicknameChange,
        message: `${oldName} changed their nickname to: ${newName}`
      })
    } catch (error: any) {
      socket.emit(Events.Msg.ChangeNickname, error.message)
    }
  }
})
