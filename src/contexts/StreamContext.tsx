'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import io, { type Socket } from 'socket.io-client'
import generateSecret from '@/lib/generateSecret'
import SocketLoading from '@/components/stream/SocketLoading'
import { PlayerState, SocketEvent } from '@/lib/enums'
import type { AuthUser } from '@/typings/types'
import type { JoinStreamPayload, Viewer, ChatMessage, StreamInfo } from '@/typings/socket'

// Stream page context
type ContextProps = {
  viewers: Viewer[],
  nickname: string,
  setNickname: (newNickname: string) => void,
  isReady: boolean,
  timeSeconds: number,
  showNicknameModal: boolean,
  setShowNicknameModal: React.Dispatch<React.SetStateAction<boolean>>,
  showAdminModal: boolean,
  setShowAdminModal: React.Dispatch<React.SetStateAction<boolean>>,
  chatMessages: (ChatMessage | { error: string })[],
  setChatMessages: React.Dispatch<React.SetStateAction<(ChatMessage | { error: string })[]>>,
  streamInfo: StreamInfo,
  lastStreamUpdateTimestamp: number | null,
  socket: Socket | null,
  socketSecret: string
}

type Props =  {
  authUser: AuthUser,
  cookieUsername: string,
  children: React.ReactNode
}

// Context provider wrapper component
export function StreamProvider({ authUser, cookieUsername, children }:Props) {
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [isReady, setIsReady] = useState<boolean>(false)
  const [timeSeconds, setTimeSeconds] = useState<number>(0)
  const [username, setUsername] = useState<string>(cookieUsername)
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(username === 'Anonymous')
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<(ChatMessage | { error: string })[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  const [socketSecret] = useState(generateSecret())

  const [streamInfo, setStreamInfo] = useState<StreamInfo>({
    state: PlayerState.Loading
  })
  const [lastStreamUpdateTimestamp, setLastStreamUpdateTimestamp] = useState<number | null>(null)

  useEffect(() => {
    const socket = io()
    // setSocket(socket)

    // On connect, send join stream payload to receive all other events
    socket.on('connect', () => {
      const joinStreamPayload: JoinStreamPayload = {
        username: username,
        secret: socketSecret,
        password: authUser.password
      }
      socket.emit(SocketEvent.JoinStream, joinStreamPayload)

      // Server responds with boolean once authenticated
      socket.on(SocketEvent.JoinStream, (isAuthenticated: boolean) => {
        if (isAuthenticated) setSocket(socket)
      })
    })

    socket.on('disconnect', () => {
      setSocket(null)
    })

    socket.on(SocketEvent.ViewersList, (viewers: Viewer[]) => {
      // console.log('Viewers list updated:', viewers)
      setViewers(viewers)
    })

    socket.on(SocketEvent.StreamInfo, (info: StreamInfo) => {
      console.log('Stream info:', info)
      setStreamInfo(info)
      setLastStreamUpdateTimestamp(Date.now())
    })

    socket.on(SocketEvent.NewChatMessage, (message: ChatMessage) => {
      setChatMessages(messages => [message, ...messages])
    })

    return () => { socket.disconnect() }
  }, [])

  const context: ContextProps = {
    viewers,
    nickname: username,
    setNickname: setUsername,
    isReady,
    timeSeconds,
    showNicknameModal: showNicknameModal,
    setShowNicknameModal: setShowNicknameModal,
    showAdminModal,
    setShowAdminModal,
    chatMessages,
    setChatMessages,
    streamInfo,
    lastStreamUpdateTimestamp,
    socket,
    socketSecret
  }

  return (
    <StreamContext.Provider value={context}>
      {/* {children} */}
      {socket ? children : <SocketLoading />}
    </StreamContext.Provider>
  )
}

// Create the context and custom hook for it
export const StreamContext = createContext<ContextProps>(null as any)
export const useStreamContext = () => useContext(StreamContext)