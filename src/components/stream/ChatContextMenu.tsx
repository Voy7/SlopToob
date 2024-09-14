'use client'

import { useSocketContext } from '@/contexts/SocketContext'
import { useStreamContext } from '@/contexts/StreamContext'
import ContextMenu from '@/components/ui/ContextMenu'
import MenuActionButton from '@/components/ui/MenuActionButton'

export default function ChatContextMenu() {
  const { setShowNicknameModal } = useSocketContext()
  const { clearChatMessages } = useStreamContext()

  return (
    <ContextMenu>
      <MenuActionButton onClick={() => setShowNicknameModal(true)} icon="edit">
        Change Nickname
      </MenuActionButton>
      <hr className="my-1 border-border1" />
      <MenuActionButton
        onClick={clearChatMessages}
        icon="delete"
        className="text-red-500 hover:bg-red-500">
        Clear Chat
      </MenuActionButton>
    </ContextMenu>
  )
}
