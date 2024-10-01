'use client'

import { useState, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'
import type { ListOption } from '@/typings/types'
import type { SettingsList } from '@/server/Settings'

type ListOptionProps = {
  value: ListOption | null
  setValue: (value: string) => void
}

export function ListOption({ value, setValue }: ListOptionProps) {
  if (value === null) return <div data-loading />

  return (
    <>
      {value.list.map((option) => (
        <label
          key={option.id}
          className={twMerge(
            'flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3',
            option.id === value.selectedID && ''
          )}
          onClick={() => setValue(option.id)}>
          {option.name}
          <div className="flex items-center gap-2">
            {option.id === value.selectedID ? (
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

export function useListOption(settingKey: keyof SettingsList) {
  const settingID = `setting.${settingKey}`

  const { socket } = useSocketContext()

  const [value, setValueState] = useState<ListOption | null>(null)

  useEffect(() => {
    socket.emit(settingID)

    socket.on(settingID, (payload: ListOption) => {
      setValueState(payload)
    })

    return () => {
      socket.off(settingID)
    }
  }, [socket])

  function setValue(selectedID: string) {
    socket.emit(settingID, selectedID)
    if (value) setValueState({ ...value, selectedID })
  }

  return { value, setValue } as const
}
