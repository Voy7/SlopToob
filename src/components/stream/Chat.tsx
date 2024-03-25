'use client'

import { useEffect, useRef, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { sendChatMessage } from '@/app/actions'
import { AuthRole } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './Chat.module.scss'

// Name colors for different roles
const roleColors = {
  [AuthRole.Normal]: 'gray',
  [AuthRole.Admin]: 'red',
}

export default function Chat() {
  const { chatMessages, setChatMessages, viewers, socketSecret } = useStreamContext()

  const [message, setMessage] = useState<string>('')

  const messagesRef = useRef<HTMLDivElement>(null)

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (message.length === 0) return
    setMessage('')

    try {
      const result = await sendChatMessage(message, socketSecret)
      
      if ('error' in result) {
        throw new Error(result.error)
      }
    }
    catch (error: any) {
      setChatMessages(messages => [{ error: error.message }, ...messages])
    }
  }

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
        <Icon name="users" />{viewers.length}
      </div>
      <div className={styles.messages} ref={messagesRef}>
        {chatMessages.map((message, index) => {
          if ('error' in message) {
            return <p key={chatMessages.length - index} className={styles.error}>{message.error}</p>
          }

          // Normal chat message
          const nameColor = roleColors[message.role]
          return (
            <p key={chatMessages.length - index} className={styles.message}>
              <span style={{ color: nameColor }}>{message.username}:</span> {message.message}
            </p>
          )
        })}
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