'use client'

import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Slider from '@/components/ui/Slider'
import ResetDefaultValue from '@/components/admin/ResetDefaultButton'
import { twMerge } from 'tailwind-merge'
import type { SettingsList } from '@/server/core/Settings'

type ToggleOptionProps = {
  label: string
  value: boolean | null
  setValue: (value: boolean) => void
  defaultValue?: boolean
}

export function ToggleOption({ label, value, setValue, defaultValue }: ToggleOptionProps) {
  if (value === null) return <div data-loading />

  return (
    <div className="mb-1 flex w-full flex-col items-center lg:mb-0 lg:flex-row lg:gap-1">
      <label className="flex w-full cursor-pointer flex-col items-center justify-between bg-bg2 px-1.5 py-1 text-center hover:bg-bg3 lg:flex-row lg:gap-4">
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
      {defaultValue !== undefined && (
        <ResetDefaultValue
          value={value}
          defaultValue={defaultValue}
          onClick={() => {
            setValue(defaultValue)
          }}
        />
      )}
    </div>
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

  return { value, setValue }
}
