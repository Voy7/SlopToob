import { useState, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import type { SettingsList } from '@/stream/Settings'
import type { ListOption } from '@/typings/types'

export default function useListOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`
  
  const { socket } = useStreamContext()
  
  const [value, setValueState] = useState<ListOption | null>(null)

  useEffect(() => {
    socket.emit(settingID)
    
    socket.on(settingID, (payload: ListOption) => {
      setValueState(payload)
    })

    return () => { socket.off(settingID) }
  }, [socket])

  function setValue(selectedID: string) {
    socket.emit(settingID, selectedID)
    if (value) setValueState({ ...value, selectedID })
  }

  return { value, setValue } as const
}