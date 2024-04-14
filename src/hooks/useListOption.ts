import { useState, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import type { SocketEvent } from '@/lib/enums'
import type { ListOption } from '@/typings/types'

export default function useListOption(event: SocketEvent) {
  const { socket } = useStreamContext()
  
  const [value, setValueState] = useState<ListOption | null>(null)

  useEffect(() => {
    socket.emit(event)
    
    socket.on(event, (payload: ListOption) => {
      setValueState(payload)
    })

    return () => { socket.off(event) }
  }, [socket])

  function setValue(selectedID: string) {
    socket.emit(event, selectedID)
    if (value) setValueState({ ...value, selectedID })
  }

  return { value, setValue } as const
}