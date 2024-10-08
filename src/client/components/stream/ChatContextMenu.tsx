'use client'

import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useStreamContext } from '@/contexts/StreamContext'
import ContextMenu from '@/components/ui/ContextMenu'
import MenuActionButton from '@/components/ui/MenuActionButton'

export default function ChatContextMenu() {
  const { setShowNicknameModal } = useSocketContext()
  const { clearChatMessages } = useStreamContext()

  const [show, setShow] = useState<boolean>(false)

  return (
    <ContextMenu show={show} setShow={setShow}>
      <MenuActionButton
        icon="edit"
        onClick={() => {
          setShowNicknameModal(true)
          setShow(false)
        }}>
        Change Nickname
      </MenuActionButton>
      <hr className="my-1 border-border1" />
      <MenuActionButton
        className="text-red-500 hover:bg-red-500"
        icon="delete"
        onClick={() => {
          clearChatMessages()
          setShow(false)
        }}>
        Clear Chat
      </MenuActionButton>
    </ContextMenu>
  )
}
