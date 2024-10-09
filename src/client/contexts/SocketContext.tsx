'use client'

import dynamic from 'next/dynamic'
import { useState, useContext, createContext, useEffect } from 'react'
import io, { type Socket } from 'socket.io-client'
import SocketConnecting from '@/components/layout/SocketConnecting'
import { Msg } from '@/shared/enums'
import type { AuthUser } from '@/typings/types'
import type { AuthenticatePayload } from '@/typings/socket'

const NicknameModal = dynamic(() => import('@/components/stream/NicknameModal'), {
  ssr: false
})

function initSocket() {
  return io({ transports: ['websocket'], upgrade: true, autoConnect: false })
}

// Stream page context
type ContextProps = {
  socket: Socket
  nickname: string
  setNickname: React.Dispatch<React.SetStateAction<string>>
  showNicknameModal: boolean
  setShowNicknameModal: React.Dispatch<React.SetStateAction<boolean>>
}

type Props = {
  authUser: AuthUser
  cookieUsername: string
  children: React.ReactNode
}

// Context provider wrapper component
export function SocketProvider({ authUser, cookieUsername, children }: Props) {
  const [socket, setSocket] = useState(initSocket())
  const [socketState, setSocketState] = useState<
    'connected' | 'connecting' | 'failed' | 'auth-failed'
  >('connecting')
  const [nickname, setNickname] = useState<string>(cookieUsername)
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(nickname === 'Anonymous')

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      socket.emit(Msg.Authenticate, {
        username: cookieUsername,
        password: authUser.password
      } satisfies AuthenticatePayload)
    })

    // socket.on('disconnect', () => {
    //   console.log('Socket disconnected')
    //   setSocketState('failed')
    // })

    socket.on('close', (reason, details) => {
      console.log('Socket close:', reason, details)
    })

    socket.on('connect_error', () => {
      setSocketState('failed')
    })

    socket.on(Msg.Authenticate, (isAuthenticated: boolean) => {
      if (isAuthenticated) setSocketState('connected')
      else setSocketState('auth-failed')
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('close')
      socket.off('connect_error')
      socket.off(Msg.Authenticate)
    }
  }, [socket])

  function retryConnection() {
    setSocket(initSocket())
    socket.connect()
    setSocketState('connecting')
  }

  if (socketState === 'connecting') return <SocketConnecting state="connecting" />
  if (socketState === 'failed') return <SocketConnecting state="failed" retry={retryConnection} />
  if (socketState === 'auth-failed')
    return <SocketConnecting state="auth-failed" retry={retryConnection} />

  const context: ContextProps = {
    socket,
    nickname,
    setNickname,
    showNicknameModal,
    setShowNicknameModal
  }

  return (
    <SocketContext.Provider value={context}>
      <NicknameModal />
      {children}
    </SocketContext.Provider>
  )
}

// Create the context and custom hook for it
export const SocketContext = createContext<ContextProps>(null as any)
export const useSocketContext = () => useContext(SocketContext)
