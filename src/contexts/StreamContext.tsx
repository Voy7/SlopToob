'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import LoadingPage from '@/components/stream/LoadingPage'
import {  Msg } from '@/lib/enums'
import type { Socket } from 'socket.io-client'
import type { AuthUser } from '@/typings/types'
import type { JoinStreamPayload, Viewer, ChatMessage, StreamInfo } from '@/typings/socket'

const MAX_CHAT_MESSAGES = 250 // Max to display in chat / remove from array

// Stream page context
type ContextProps = {
  viewers: Viewer[],
  nickname: string, setNickname: React.Dispatch<React.SetStateAction<string>>,
  showNicknameModal: boolean, setShowNicknameModal: React.Dispatch<React.SetStateAction<boolean>>,
  showAdminModal: boolean, setShowAdminModal: React.Dispatch<React.SetStateAction<boolean>>,
  showKeybindsModal: boolean, setShowKeybindsModal: React.Dispatch<React.SetStateAction<boolean>>,
  showClearChatModal: boolean, setShowClearChatModal: React.Dispatch<React.SetStateAction<boolean>>,
  chatMessages: (ChatMessage & { time: number })[],
  addChatMessage: (message: ChatMessage) => void,
  clearChatMessages: () => void,
  streamInfo: StreamInfo,
  lastStreamUpdateTimestamp: number | null,
  socket: Socket
}

type Props =  {
  authUser: AuthUser,
  cookieUsername: string,
  children: React.ReactNode
}

// Context provider wrapper component
export function StreamProvider({ authUser, cookieUsername, children }: Props) {
  const { socket } = useSocketContext()

  const [viewers, setViewers] = useState<Viewer[]>([])
  const [nickname, setNickname] = useState<string>(cookieUsername)
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(nickname === 'Anonymous')
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false)
  const [showKeybindsModal, setShowKeybindsModal] = useState<boolean>(false)
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<(ChatMessage & { time: number })[]>([])
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [lastStreamUpdateTimestamp, setLastStreamUpdateTimestamp] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    socket.emit(Msg.JoinStream,  {
      username: cookieUsername,
      password: authUser.password
    } satisfies JoinStreamPayload)
  }, [])

  useSocketOn(Msg.JoinStream, (isAuthenticated: boolean) => setIsAuthenticated(isAuthenticated))

  useSocketOn(Msg.StreamInfo, (info: StreamInfo) => {
    setStreamInfo(info)
    setLastStreamUpdateTimestamp(Date.now())
  })

  useSocketOn(Msg.NewChatMessage, (message: ChatMessage) => addChatMessage(message))

  useSocketOn(Msg.ViewersList, (viewers: Viewer[]) => setViewers(viewers))

  function addChatMessage(message: ChatMessage) {
    setChatMessages(prev => {
      const newMessages = [{ ...message, time: Date.now() }, ...prev]
      return newMessages.length > MAX_CHAT_MESSAGES ? newMessages.slice(0, MAX_CHAT_MESSAGES) : newMessages
    })
  }

  function clearChatMessages() {
    setChatMessages([])
    setShowClearChatModal(false)
  }
  
  if (!isAuthenticated) return <LoadingPage text="Authenticating..." />
  if (!streamInfo) return <LoadingPage text="Fetching stream info..." />

  const context: ContextProps = {
    viewers,
    nickname, setNickname,
    showNicknameModal, setShowNicknameModal,
    showAdminModal, setShowAdminModal,
    showKeybindsModal, setShowKeybindsModal,
    showClearChatModal, setShowClearChatModal,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    streamInfo,
    lastStreamUpdateTimestamp,
    socket
  }

  return <StreamContext.Provider value={context}>{children}</StreamContext.Provider>
}

// Create the context and custom hook for it
export const StreamContext = createContext<ContextProps>(null as any)
export const useStreamContext = () => useContext(StreamContext)