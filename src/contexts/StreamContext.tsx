'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import LoadingPage from '@/components/stream/LoadingPage'
import {  Msg } from '@/lib/enums'
import type { AuthUser } from '@/typings/types'
import type { Socket } from 'socket.io-client'
import type { JoinStreamPayload, Viewer, ChatMessage, StreamInfo } from '@/typings/socket'

// Stream page context
type ContextProps = {
  viewers: Viewer[],
  nickname: string, setNickname: React.Dispatch<React.SetStateAction<string>>,
  showNicknameModal: boolean, setShowNicknameModal: React.Dispatch<React.SetStateAction<boolean>>,
  showAdminModal: boolean, setShowAdminModal: React.Dispatch<React.SetStateAction<boolean>>,
  chatMessages: (ChatMessage & { time: number })[], setChatMessages: React.Dispatch<React.SetStateAction<(ChatMessage & { time: number })[]>>,
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
export function StreamProvider({ authUser, cookieUsername, children }:Props) {
  const { socket } = useSocketContext()

  const [viewers, setViewers] = useState<Viewer[]>([])
  const [nickname, setNickname] = useState<string>(cookieUsername)
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(nickname === 'Anonymous')
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false)
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

  useSocketOn(Msg.NewChatMessage, (message: ChatMessage) => {
    setChatMessages(messages => [{ ...message, time: Date.now() }, ...messages])
  })

  useSocketOn(Msg.ViewersList, (viewers: Viewer[]) => setViewers(viewers))
  
  if (!isAuthenticated) return <LoadingPage text="Authenticating..." />
  if (!streamInfo) return <LoadingPage text="Fetching stream info..." />

  const context: ContextProps = {
    viewers,
    nickname, setNickname,
    showNicknameModal, setShowNicknameModal,
    showAdminModal, setShowAdminModal,
    chatMessages, setChatMessages,
    streamInfo: streamInfo,
    lastStreamUpdateTimestamp,
    socket
  }

  return <StreamContext.Provider value={context}>{children}</StreamContext.Provider>
}

// Create the context and custom hook for it
export const StreamContext = createContext<ContextProps>(null as any)
export const useStreamContext = () => useContext(StreamContext)