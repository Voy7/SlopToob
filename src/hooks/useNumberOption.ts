import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import type { SettingsList } from '@/server/Settings'

export default function useToggleOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`

  const { socket } = useSocketContext()

  const [value, setValueState] = useState<number | null>(null)

  useEffect(() => {
    socket.emit(settingID)

    socket.on(settingID, (value: number) => {
      setValueState(value)
    })

    return () => {
      socket.off(settingID)
    }
  }, [socket])

  function setValue(value: number) {
    socket.emit(settingID, value)
    setValueState(value)
  }

  return { value, setValue } as const
}
