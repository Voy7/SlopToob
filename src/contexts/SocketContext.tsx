'use client'

import dynamic from 'next/dynamic'
import { useState, useContext, createContext, useEffect } from 'react'
import io, { type Socket } from 'socket.io-client'
import LoadingPage from '@/components/stream/LoadingPage'
import { Msg } from '@/lib/enums'
import type { AuthUser } from '@/typings/types'
import type { AuthenticatePayload } from '@/typings/socket'

const NicknameModal = dynamic(() => import('@/components/stream/NicknameModal'), { ssr: false })

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
  const [socket, setSocket] = useState<Socket | null | false>(null)
  const [nickname, setNickname] = useState<string>(cookieUsername)
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(nickname === 'Anonymous')

  useEffect(() => {
    const socket = io()

    socket.on('connect', () => {
      socket.emit(Msg.Authenticate, {
        username: cookieUsername,
        password: authUser.password
      } satisfies AuthenticatePayload)
    })

    socket.on('disconnect', () => setSocket(null))

    socket.on(Msg.Authenticate, (isAuthenticated: boolean) => {
      if (isAuthenticated) setSocket(socket)
      else setSocket(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (socket === null) return <LoadingPage text="Connecting..." />
  if (socket === false) return <LoadingPage text="Authentication failed." />

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
