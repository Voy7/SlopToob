import { useState, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import type { SettingsList } from '@/stream/Settings'

export default function useToggleOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`

  const { socket } = useStreamContext()
  
  const [value, setValueState] = useState<boolean | null>(null)

  useEffect(() => {
    socket.emit(settingID)

    socket.on(settingID, (value: boolean) => {
      setValueState(value)
    })

    return () => { socket.off(settingID) }
  }, [socket])

  function setValue(value: boolean) {
    socket.emit(settingID, value)
    setValueState(value)
  }

  return { value, setValue } as const
}