// 'use client'

// import { useState, useContext, createContext, useEffect } from 'react'
// import io, { type Socket } from 'socket.io-client'
// import generateSecret from '@/lib/generateSecret'
// import SocketLoading from '@/components/stream/SocketLoading'
// import { StreamState, SocketEvent } from '@/lib/enums'
// import type { AuthUser } from '@/typings/types'
// import type { JoinStreamPayload, Viewer, ChatMessage, StreamInfo } from '@/typings/socket'

// // Socket context
// type ContextProps = {
//   socket: Socket,
//   socketSecret: string
// }

// type Props =  {
//   authUser: AuthUser,
//   cookieUsername: string,
//   children: React.ReactNode
// }

// // Context provider wrapper component
// export function SocketProvider({ authUser, cookieUsername, children }:Props) {
//   const [socket, setSocket] = useState<Socket | null>(null)
//   const [socketSecret] = useState(generateSecret())

//   useEffect(() => {
//     const socket = io()
//     // setSocket(socket)

//     // On connect, send join stream payload to receive all other events
//     socket.on('connect', () => {
//       const joinStreamPayload: JoinStreamPayload = {
//         username: nickname,
//         secret: socketSecret,
//         password: authUser.password
//       }
//       socket.emit(SocketEvent.JoinStream, joinStreamPayload)
//     })

//     return () => { socket.disconnect() }
//   }, [])

//   const context: ContextProps = {
//     viewers,
//     nickname, setNickname,
//     showNicknameModal, setShowNicknameModal,
//     showAdminModal, setShowAdminModal,
//     chatMessages, setChatMessages,
//     streamInfo,
//     lastStreamUpdateTimestamp,
//     socket,
//     socketSecret
//   }

//   return (
//     <StreamContext.Provider value={context}>
//       {/* {children} */}
//       {socket ? children : <SocketLoading />}
//     </StreamContext.Provider>
//   )
// }

// // Create the context and custom hook for it
// export const StreamContext = createContext<ContextProps>(null as any)
// export const useStreamContext = () => useContext(StreamContext)