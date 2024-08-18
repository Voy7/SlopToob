'use client'

import { useEffect, useRef, useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useStreamContext } from '@/contexts/StreamContext'
import useSocketOn from '@/hooks/useSocketOn'
import { ChatType, Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ChatMessage from '@/components/stream/ChatMessage'
import ChatViewersList from '@/components/stream/ChatViewersList'
import HoverTooltip from '@/components/ui/HoverTooltip'
import ActionModal from '@/components/ui/ActionModal'
import styles from './Chat.module.scss'

export default function Chat() {
  const { socket, nickname, showNicknameModal, setShowNicknameModal } = useSocketContext()
  const {
    streamInfo,
    showClearChatModal,
    setShowClearChatModal,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    viewers
  } = useStreamContext()

  const [message, setMessage] = useState<string>('')
  const [showViewersList, setShowViewersList] = useState<boolean>(false)

  const messagesRef = useRef<HTMLDivElement>(null)

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (message.length === 0) return
    setMessage('')

    socket.emit(Msg.SendChatMessage, message)
  }

  // If message received, it's an error
  useSocketOn(Msg.SendChatMessage, (error: string) => {
    addChatMessage({ type: ChatType.Error, message: error })
  })

  // When new message is received, scroll to bottom of container if it's already at the bottom
  useEffect(() => {
    if (messagesRef.current) {
      const messagesContainer = messagesRef.current
      const isScrolledToBottom =
        messagesContainer.scrollHeight - messagesContainer.clientHeight <=
        messagesContainer.scrollTop + 1

      if (isScrolledToBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }, [chatMessages])

  return (
    <>
      <div className={styles.chat}>
        <div className={styles.header}>
          <button
            className={
              showViewersList ? `${styles.viewersButton} ${styles.active}` : styles.viewersButton
            }
            onClick={() => setShowViewersList(!showViewersList)}>
            {!showViewersList && (
              <HoverTooltip placement="bottom-start">Open Viewers List</HoverTooltip>
            )}
            <Icon name="users" />
            {viewers.length}
          </button>
          <button className={styles.usernameButton} onClick={() => setShowNicknameModal(true)}>
            {!showNicknameModal && (
              <HoverTooltip placement="bottom-end">Change Nickname</HoverTooltip>
            )}
            {nickname}
            <Icon name="edit" />
          </button>

          {showViewersList && <ChatViewersList close={() => setShowViewersList(false)} />}
        </div>
        <div className={styles.messages} ref={messagesRef}>
          {chatMessages.length > 0 ? (
            chatMessages.map((chat, index) => (
              <ChatMessage key={chatMessages.length - index} chat={chat} />
            ))
          ) : (
            <div className={styles.noMessages}>
              <Icon name="chat" />
              <p>No messages, send one below.</p>
            </div>
          )}
        </div>
        <form onSubmit={submitMessage} className={styles.inputContainer}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button>
            <Icon name="send" />
          </button>
        </form>
      </div>
      <ActionModal
        title="Clear Chat"
        isOpen={showClearChatModal}
        setClose={() => setShowClearChatModal(false)}
        button={
          <Button style="main" icon="delete" onClick={clearChatMessages} isSubmit autoFocus>
            Clear Chat
          </Button>
        }
        width={380}>
        <p>Are you sure you want to clear {chatMessages.length} messages?</p>
      </ActionModal>
    </>
  )
}
