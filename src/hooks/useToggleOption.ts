import { useState, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import type { SocketEvent } from '@/lib/enums'

export default function useToggleOption(event: SocketEvent) {
  const { socket } = useStreamContext()
  
  const [value, setValueState] = useState<boolean | null>(null)

  useEffect(() => {
    socket.emit(event)

    socket.on(event, (value: boolean) => {
      setValueState(value)
    })

    return () => { socket.off(event) }
  }, [socket])

  function setValue(value: boolean) {
    socket.emit(event, value)
  }

  return { value, setValue } as const
}