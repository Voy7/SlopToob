import { useEffect, type DependencyList } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/shared/enums'

export default function useSocketOn<T>(
  event: Msg,
  callback: (payload: T) => void,
  deps: DependencyList = []
) {
  const { socket } = useSocketContext()

  useEffect(() => {
    socket.on(event, callback)
    return () => {
      socket.off(event)
    }
  }, [...deps])
}
