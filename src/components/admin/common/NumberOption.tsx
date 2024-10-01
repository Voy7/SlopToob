'use client'

import { useState, useEffect, useRef } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'
import type { SettingsList } from '@/server/Settings'

type NumberOptionProps = {
  label: string
  type: 'integer' | 'float' | 'percentage'
  value: number | null
  setValue: (value: number) => void
}

export function NumberOption({ label, type, value, setValue }: NumberOptionProps) {
  if (value === null) return <div data-loading />

  const [input, setInput] = useState<string>(`${value}`)
  const [isValid, setIsValid] = useState<true | null | string>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Update input when value changes from server
  useEffect(() => {
    setInput(`${value}`)
    setIsValid(checkIsValid(`${value}`))
  }, [value])

  // Update width of input based on value
  useEffect(() => {
    if (!inputRef.current) return
    const input = inputRef.current
    input.style.width = `calc(${input.value.length}ch + 1em)`
  }, [input])

  function onSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const isValid = checkIsValid(input)
    setIsValid(isValid)
    if (isValid === true) {
      setValue(Number(input))
      inputRef.current?.blur()
    }
  }

  function checkIsValid(value: string | null): true | null | string {
    if (value === null) return null
    if (value === '') return 'Empty value.'
    if (type === 'float') return !isNaN(Number(value)) || 'Not a number.'
    if (type === 'integer') return Number.isInteger(Number(value)) || 'Not an integer.'
    if (type === 'percentage') {
      // Is integer between 0 and 100
      const number = Number(value)
      return (Number.isInteger(number) && number >= 0 && number <= 100) || 'Not between 0 - 100.'
    }
    return null
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3">
        {label}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <p
              key={`${isValid}`}
              className={twMerge(
                'flex translate-x-4 scale-90 transform items-center gap-1 text-red-500 opacity-90 transition-all duration-150 ease-in-out',
                typeof isValid === 'string' && 'translate-x-0 scale-100 opacity-100'
              )}>
              <Icon name="warning" />
              {isValid}
            </p>
            <input
              ref={inputRef}
              type="text"
              value={`${input}`}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => setIsEditing(true)}
              onBlur={() => {
                setIsEditing(false)
                onSubmit()
              }}
            />
          </div>
        </div>
      </label>
    </form>
  )
}

export function useNumberOption(settingKey: keyof SettingsList) {
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
