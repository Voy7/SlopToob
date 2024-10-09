'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import LoadingPage from '@/components/layout/LoadingPage'
import { Msg } from '@/shared/enums'
import type { Viewer, ChatMessage, ViewerStreamInfo, ClientScheduleDisplay } from '@/typings/socket'

const MAX_CHAT_MESSAGES = 250 // Max to display in chat / remove from array

// Stream page context
type ContextProps = {
  viewers: Viewer[]
  showAdminModal: boolean
  setShowAdminModal: React.Dispatch<React.SetStateAction<boolean>>
  showKeybindsModal: boolean
  setShowKeybindsModal: React.Dispatch<React.SetStateAction<boolean>>
  showClearChatModal: boolean
  setShowClearChatModal: React.Dispatch<React.SetStateAction<boolean>>
  chatMessages: (ChatMessage & { time: number })[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  streamInfo: ViewerStreamInfo
  lastStreamUpdateTimestamp: number | null
  scheduleDisplay: ClientScheduleDisplay | null
}

// Context provider wrapper component
export function StreamProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext()

  const [viewers, setViewers] = useState<Viewer[]>([])
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false)
  const [showKeybindsModal, setShowKeybindsModal] = useState<boolean>(false)
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<(ChatMessage & { time: number })[]>([])
  const [streamInfo, setStreamInfo] = useState<ViewerStreamInfo | null>(null)
  const [lastStreamUpdateTimestamp, setLastStreamUpdateTimestamp] = useState<number | null>(null)
  const [scheduleDisplay, setScheduleDisplay] = useState<ClientScheduleDisplay | null | undefined>()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    socket.emit(Msg.JoinStream)
  }, [])

  useSocketOn(Msg.JoinStream, (isAuthenticated: boolean) => setIsAuthenticated(isAuthenticated))

  useSocketOn(Msg.StreamInfo, (info: ViewerStreamInfo) => {
    setStreamInfo(info)
    setLastStreamUpdateTimestamp(Date.now())
  })

  useSocketOn(Msg.ScheduleDisplay, (payload: ClientScheduleDisplay | null) =>
    setScheduleDisplay(payload)
  )

  useSocketOn(Msg.NewChatMessage, (message: ChatMessage) => addChatMessage(message))

  useSocketOn(Msg.ViewersList, (viewers: Viewer[]) => setViewers(viewers))

  function addChatMessage(message: ChatMessage) {
    setChatMessages((prev) => {
      const newMessages = [{ ...message, time: Date.now() }, ...prev]
      return newMessages.length > MAX_CHAT_MESSAGES
        ? newMessages.slice(0, MAX_CHAT_MESSAGES)
        : newMessages
    })
  }

  function clearChatMessages() {
    setChatMessages([])
    setShowClearChatModal(false)
  }

  if (!isAuthenticated) return <LoadingPage text="Authenticating..." />
  if (!streamInfo) return <LoadingPage text="Fetching stream info..." />
  if (scheduleDisplay === undefined) return <LoadingPage text="Fetching schedule..." />

  const context: ContextProps = {
    viewers,
    showAdminModal,
    setShowAdminModal,
    showKeybindsModal,
    setShowKeybindsModal,
    showClearChatModal,
    setShowClearChatModal,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    streamInfo,
    lastStreamUpdateTimestamp,
    scheduleDisplay
  }

  return <StreamContext.Provider value={context}>{children}</StreamContext.Provider>
}

// Create the context and custom hook for it
export const StreamContext = createContext<ContextProps>(null as any)
export const useStreamContext = () => useContext(StreamContext)
