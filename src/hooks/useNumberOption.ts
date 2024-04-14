import { useState, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import type { SocketEvent } from '@/lib/enums'

export default function useToggleOption(event: SocketEvent) {
  const { socket } = useStreamContext()
  
  const [value, setValueState] = useState<number | null>(null)

  useEffect(() => {
    socket.emit(event)

    socket.on(event, (value: number) => {
      setValueState(value)
    })

    return () => { socket.off(event) }
  }, [socket])

  function setValue(value: number) {
    socket.emit(event, value)
    setValueState(value)
  }

  return { value, setValue } as const
}