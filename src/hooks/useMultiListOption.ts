import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import type { SettingsList } from '@/server/Settings'
import type { MultiListOption } from '@/typings/types'

export default function useMultiListOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`

  const { socket } = useSocketContext()

  const [value, setValueState] = useState<MultiListOption | null>(null)

  useEffect(() => {
    socket.emit(settingID)

    socket.on(settingID, (payload: MultiListOption) => {
      setValueState(payload)
    })

    return () => {
      socket.off(settingID)
    }
  }, [socket])

  function setValue(selectedIDs: string[]) {
    socket.emit(settingID, selectedIDs)
    if (value) setValueState({ ...value, selectedIDs })
  }

  return { value, setValue } as const
}
