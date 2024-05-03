'use client'

import { useEffect, useRef, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import useSocketOn from '@/hooks/useSocketOn'
import { AuthRole, ChatType, Msg } from '@/lib/enums'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import styles from './Chat.module.scss'

// Name colors for different roles
const roleColors = {
  [AuthRole.Normal]: '#00ff73',
  [AuthRole.Admin]: '#ff4545',
}

const eventIcons = {
  [ChatType.Joined]: <Icon name="arrow-right" />,
  [ChatType.Left]: <Icon name="arrow-left" />,
  [ChatType.NicknameChange]: <Icon name="edit" />,
  [ChatType.VotedToSkip]: <Icon name="skip" />,
  [ChatType.VoteSkipPassed]: <Icon name="skip" />,
}

export default function Chat() {
  const { socket, streamInfo, chatMessages, setChatMessages, viewers, nickname, setShowNicknameModal } = useStreamContext()

  const [message, setMessage] = useState<string>('')

  const messagesRef = useRef<HTMLDivElement>(null)

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (message.length === 0) return
    setMessage('')

    socket.emit(Msg.SendChatMessage, message)
  }

  // If message received, it's an error
  useSocketOn(Msg.SendChatMessage, (error: string) => {
    setChatMessages(messages => [{ type: ChatType.Error, message: error, time: Date.now() }, ...messages])
  })

  // When new message is received, scroll to bottom of container if it's already at the bottom
  useEffect(() => {
    if (messagesRef.current) {
      const messagesContainer = messagesRef.current
      const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 1

      if (isScrolledToBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }, [chatMessages])

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <div className={styles.viewerCount} title={`${viewers.length} Viewers`}>
          <Icon name="users" />{viewers.length}
        </div>
        <button className={styles.usernameButton} onClick={() => setShowNicknameModal(true)} title="Change Nickname">
          {nickname}<Icon name="edit" />
        </button>
      </div>
      <div className={styles.messages} ref={messagesRef}>
        {chatMessages.length > 0 ? chatMessages.map((chat, index) => {
          // Timestamp format: HH:MM AM/PM
          const timestamp = new Date(chat.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          const fullTimestamp = new Date(chat.time).toLocaleString('en-US')

          // Normal user chat message
          if (chat.type === ChatType.UserChat) {
            const nameColor = roleColors[chat.role]
            return (
              <div key={chatMessages.length - index} className={styles.message}>
                <div>
                  {streamInfo.chat.showIdenticons && (
                    <img src={chat.image} alt="" className={styles.image} />
                  )}
                  <p><span style={{ color: nameColor }}>{chat.username}:</span> {chat.message}</p>
                </div>
                {streamInfo.chat.showTimestamps && (
                  <span className={styles.timestamp} title={fullTimestamp}>{timestamp}</span>
                )}
              </div>
            )
          }

          // Is error, use different styling
          if (chat.type === ChatType.Error) {
            return (
              <div key={chatMessages.length - index} className={styles.error}>
                <p>{chat.message}</p>
              </div>
            )
          }

          // Chat event message
          const icon = eventIcons[chat.type]
          return (
            <div key={chatMessages.length - index} className={styles.event}>
              <p>{icon && icon}{chat.message}</p>
              {streamInfo.chat.showTimestamps && (
                <span className={styles.timestamp} title={fullTimestamp}>{timestamp}</span>
              )}
            </div>
          )
        }) : (
          <div className={styles.noMessages}>
            <Icon name="chat" />
            <p>No messages, send one below.</p>
          </div>
        )}
      </div>
      <form onSubmit={submitMessage} className={styles.inputContainer}>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <button>
          <Icon name="send" />
        </button>
      </form>
    </div>
  )
}