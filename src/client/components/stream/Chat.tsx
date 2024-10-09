'use client'

import { useEffect, useRef, useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useStreamContext } from '@/contexts/StreamContext'
import useSocketOn from '@/hooks/useSocketOn'
import { ChatType, Msg } from '@/shared/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ChatMessage from '@/components/stream/ChatMessage'
import ChatViewersList from '@/components/stream/ChatViewersList'
import HoverTooltip from '@/components/ui/HoverTooltip'
import ChatContextMenu from '@/components/stream/ChatContextMenu'
import ActionModal from '@/components/ui/ActionModal'
import { twMerge } from 'tailwind-merge'

export default function Chat() {
  const { socket, nickname, showNicknameModal, setShowNicknameModal } = useSocketContext()
  const {
    showClearChatModal,
    setShowClearChatModal,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    viewers
  } = useStreamContext()

  const [message, setMessage] = useState<string>('')
  const [showViewersList, setShowViewersListState] = useState<boolean>(
    document.cookie.includes('show-viewers-list=true')
  )

  function setShowViewersList(value: boolean) {
    document.cookie = value
      ? 'show-viewers-list=true; max-age=31536000; path=/' // 1 year
      : 'show-viewers-list=; max-age=0; path=/'
    setShowViewersListState(value)
  }

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
      <div className="flex h-[20rem] w-full flex-col justify-end overflow-hidden p-2 md:h-full md:w-[var(--chat-width)]">
        <div className="relative flex w-full items-center justify-between gap-4 border-b border-[var(--border-color-1)]">
          <button
            className={twMerge(
              'flex cursor-pointer items-center gap-1 border-none bg-transparent p-2 text-text2',
              showViewersList ? 'bg-bg3 text-text1' : 'hover:bg-bg2 hover:text-text1'
            )}
            onClick={() => setShowViewersList(!showViewersList)}>
            {!showViewersList && (
              <HoverTooltip placement="bottom-start">Open Viewers List</HoverTooltip>
            )}
            <Icon name="users" />
            {viewers.length}
          </button>
          <button
            className="flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-2 text-text2 hover:bg-bg2 hover:text-text1"
            onClick={() => setShowNicknameModal(true)}>
            {!showNicknameModal && (
              <HoverTooltip placement="bottom-end">Change Nickname</HoverTooltip>
            )}
            {nickname}
            <Icon name="edit" className="-translate-y-1 transform text-xs" />
          </button>

          {showViewersList && <ChatViewersList close={() => setShowViewersList(false)} />}
        </div>
        <div
          className="flex flex-grow flex-col-reverse overflow-y-auto overflow-x-hidden overscroll-contain p-2"
          ref={messagesRef}>
          <ChatContextMenu />
          {chatMessages.length > 0 ? (
            chatMessages.map((chat, index) => (
              <ChatMessage key={chatMessages.length - index} chat={chat} />
            ))
          ) : (
            <div className="flex h-full cursor-default flex-col items-center justify-center gap-3 text-lg text-text3">
              <Icon name="chat" className="text-2xl" />
              <p>No messages, send one below.</p>
            </div>
          )}
        </div>
        <form
          onSubmit={submitMessage}
          className="flex w-full items-center gap-2 border-b border-t border-border1 py-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="font-inherit w-full resize-none rounded-full border border-transparent bg-bg2 px-3 py-2 text-base text-text3 focus:border-border1 focus:text-text1 focus:outline-none"
          />
          <button className="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-bg2 p-2 text-xl text-text3 hover:bg-bg3">
            <Icon name="send" />
          </button>
        </form>
      </div>

      <ActionModal
        title="Clear Chat"
        isOpen={showClearChatModal}
        setClose={() => setShowClearChatModal(false)}
        button={
          <Button variant="main" icon="delete" onClick={clearChatMessages} isSubmit autoFocus>
            Clear Chat
          </Button>
        }
        width={380}>
        <p>Are you sure you want to clear {chatMessages.length} messages?</p>
      </ActionModal>
    </>
  )
}
