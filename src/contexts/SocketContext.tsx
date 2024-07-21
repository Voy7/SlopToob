'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import io, { type Socket } from 'socket.io-client'
import LoadingPage from '@/components/stream/LoadingPage'

// Stream page context
type ContextProps = {
  socket: Socket
}

// Context provider wrapper component
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socket = io()

    socket.on('connect', () => setSocket(socket))
    socket.on('disconnect', () => setSocket(null))

    return () => {
      socket.disconnect()
    }
  }, [])

  if (!socket) return <LoadingPage text="Connecting..." />

  const context: ContextProps = { socket }

  return <SocketContext.Provider value={context}>{children}</SocketContext.Provider>
}

// Create the context and custom hook for it
export const SocketContext = createContext<ContextProps>(null as any)
export const useSocketContext = () => useContext(SocketContext)
