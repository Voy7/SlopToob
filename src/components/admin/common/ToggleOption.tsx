'use client'

import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Slider from '@/components/ui/Slider'
import type { SettingsList } from '@/server/Settings'

type ToggleOptionProps = {
  label: string
  value: boolean | null
  setValue: (value: boolean) => void
}

export function ToggleOption({ label, value, setValue }: ToggleOptionProps) {
  if (value === null) return <div data-loading />

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3">
      {label}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <p key={`${value}`} className="animate-fade-in text-text3">
            {value ? 'Enabled' : 'Disabled'}
          </p>
          <Slider value={value} onChange={(event) => setValue(event.target.checked)} />
        </div>
      </div>
    </label>
  )
}

export function useToggleOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`

  const { socket } = useSocketContext()

  const [value, setValueState] = useState<boolean | null>(null)

  useEffect(() => {
    socket.emit(settingID)

    socket.on(settingID, (value: boolean) => {
      setValueState(value)
    })

    return () => {
      socket.off(settingID)
    }
  }, [socket])

  function setValue(value: boolean) {
    socket.emit(settingID, value)
    setValueState(value)
  }

  return { value, setValue } as const
}
