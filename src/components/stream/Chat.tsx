'use client'

import { useEffect, useRef, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import useSocketOn from '@/hooks/useSocketOn'
import useTooltip from '@/hooks/useTooltip'
import { AuthRole, ChatType, Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import ActionModal from '@/components/ui/ActionModal'
import styles from './Chat.module.scss'

// Name colors for different roles
const roleColors = {
  [AuthRole.Normal]: '#00ff73',
  [AuthRole.Admin]: '#ff4545'
}

const eventIcons = {
  [ChatType.Joined]: <Icon name="arrow-right" />,
  [ChatType.Left]: <Icon name="arrow-left" />,
  [ChatType.NicknameChange]: <Icon name="edit" />,
  [ChatType.VotedToSkip]: <Icon name="skip" />,
  [ChatType.VoteSkipPassed]: <Icon name="skip" style={{ color: 'lime' }} />,
  [ChatType.AdminPause]: <Icon name="pause" style={{ color: 'rgb(255, 95, 95)' }} />,
  [ChatType.AdminUnpause]: <Icon name="play" style={{ color: 'rgb(255, 95, 95)' }} />,
  [ChatType.AdminSkip]: <Icon name="skip" style={{ color: 'rgb(255, 95, 95)' }} />,
  [ChatType.AdminChangePlaylist]: <Icon name="playlist" style={{ color: 'rgb(255, 95, 95)' }} />
}

export default function Chat() {
  const {
    socket,
    streamInfo,
    showClearChatModal,
    setShowClearChatModal,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    viewers,
    nickname,
    showNicknameModal,
    setShowNicknameModal
  } = useStreamContext()

  const [message, setMessage] = useState<string>('')
  const [showViewersList, setShowViewersList] = useState<boolean>(false)

  const messagesRef = useRef<HTMLDivElement>(null)

  const viewersTooltip = useTooltip('bottom-start')
  const nicknameTooltip = useTooltip('bottom-end')

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
            onClick={() => setShowViewersList(!showViewersList)}
            {...viewersTooltip.anchorProps}
          >
            <Icon name="users" />
            {viewers.length}
          </button>
          {!showViewersList && (
            <Tooltip {...viewersTooltip.tooltipProps}>Open Viewers List</Tooltip>
          )}
          <button
            className={styles.usernameButton}
            onClick={() => setShowNicknameModal(true)}
            {...nicknameTooltip.anchorProps}
          >
            {nickname}
            <Icon name="edit" />
          </button>
          {!showNicknameModal && (
            <Tooltip {...nicknameTooltip.tooltipProps}>Change Nickname</Tooltip>
          )}

          {showViewersList && (
            <div className={styles.viewersList}>
              <header>
                <h3>{viewers.length} Viewers</h3>
                <button onClick={() => setShowViewersList(false)}>
                  <Icon name="close" />
                </button>
              </header>
              <ul>
                {viewers.map((viewer, index) => (
                  <li key={index}>
                    {streamInfo.chat.showIdenticons && <img src={viewer.image} alt="" />}
                    <span style={{ color: roleColors[viewer.role] }}>{viewer.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={styles.messages} ref={messagesRef}>
          {chatMessages.length > 0 ? (
            chatMessages.map((chat, index) => {
              // Timestamp format: HH:MM AM/PM
              const timestamp = new Date(chat.time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })
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
                      <p>
                        <span style={{ color: nameColor }}>{chat.username}:</span> {chat.message}
                      </p>
                    </div>
                    {streamInfo.chat.showTimestamps && (
                      <Timestamp hoverText={fullTimestamp}>{timestamp}</Timestamp>
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
                  <p>
                    {icon && icon}
                    {chat.message}
                  </p>
                  {streamInfo.chat.showTimestamps && (
                    <Timestamp hoverText={fullTimestamp}>{timestamp}</Timestamp>
                  )}
                </div>
              )
            })
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
        width={380}
      >
        <p>Are you sure you want to clear {chatMessages.length} messages?</p>
      </ActionModal>
    </>
  )
}

function Timestamp({ hoverText, children }: { hoverText: string; children: string }) {
  const timestampTooltip = useTooltip('top-end')

  return (
    <>
      <span className={styles.timestamp} {...timestampTooltip.anchorProps}>
        {children}
      </span>
      <Tooltip {...timestampTooltip.tooltipProps}>{hoverText}</Tooltip>
    </>
  )
}
