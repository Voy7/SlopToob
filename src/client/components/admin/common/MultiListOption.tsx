'use client'

import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'
import type { MultiListOption } from '@/typings/types'
import type { SettingsList } from '@/server/core/Settings'

type MultiListOptionProps = {
  value: MultiListOption | null
  toggle: (id: string) => void
}

export function MultiListOption({ value, toggle }: MultiListOptionProps) {
  if (value === null) return <div data-loading />

  return (
    <>
      {value.list.map((option) => (
        <label
          key={option.id}
          className={twMerge(
            'flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3',
            value.selectedIDs.includes(option.id) && ''
          )}
          onClick={() => toggle(option.id)}>
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

  function toggle(id: string) {
    if (!value) return
    const newValues = value.selectedIDs.includes(id)
      ? value.selectedIDs.filter((selectedID) => selectedID !== id)
      : [...value.selectedIDs, id]
    socket.emit(settingID, newValues)
    setValueState({ ...value, selectedIDs: newValues })
  }

  return { value, toggle }
}
