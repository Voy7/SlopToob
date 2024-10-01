'use client'

import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'
import type { MultiListOption } from '@/typings/types'
import type { SettingsList } from '@/server/Settings'

type MultiListOptionProps = {
  value: MultiListOption | null
  setValue: (value: string[]) => void
}

export function MultiListOption({ value, setValue }: MultiListOptionProps) {
  if (value === null) return null

  function toggleOption(option: string) {
    if (!value) return
    setValue(
      value.selectedIDs.includes(option)
        ? value.selectedIDs.filter((id) => id !== option)
        : [...value.selectedIDs, option]
    )
  }

  return (
    <>
      {value.list.map((option) => (
        <label
          key={option.id}
          className={twMerge(
            'flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3',
            value.selectedIDs.includes(option.id) && ''
          )}
          onClick={() => toggleOption(option.id)}>
          {option.name}
          <div className="flex items-center gap-2">
            {value.selectedIDs.includes(option.id) ? (
              <div className="flex items-center gap-2">
                <p>Selected</p>
                <Icon name="radio-checked" />
              </div>
            ) : (
              <Icon name="radio-unchecked" />
            )}
          </div>
        </label>
      ))}
    </>
  )
}

export function useMultiListOption(settingKey: keyof SettingsList) {
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