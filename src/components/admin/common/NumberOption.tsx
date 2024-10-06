'use client'

import { useState, useEffect, useRef } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import ResetDefaultValue from '@/components/admin/ResetDefaultButton'
import { twMerge } from 'tailwind-merge'
import type { SettingsList } from '@/server/Settings'

type NumberOptionProps = {
  label: string
  type: 'integer' | 'float' | 'percentage'
  value: number | null
  setValue: (value: number) => void
  defaultValue?: number
}

export function NumberOption({ label, type, value, setValue, defaultValue }: NumberOptionProps) {
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
    <form
      onSubmit={onSubmit}
      className="mb-1 flex w-full flex-col items-center lg:mb-0 lg:flex-row lg:gap-1">
      <label
        className={twMerge(
          'flex w-full cursor-pointer flex-col items-center justify-between bg-bg2 px-1.5 py-1 text-center lg:flex-row lg:gap-4',
          isEditing ? 'bg-bg4' : 'hover:bg-bg3'
        )}>
        {label}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <p
              key={`${isValid}`}
              className={twMerge(
                'flex translate-x-4 scale-90 transform items-center gap-1 text-red-500 opacity-0 transition-all duration-150 ease-in-out',
                typeof isValid === 'string' && 'translate-x-0 scale-100 opacity-100'
              )}>
              <Icon name="warning" />
              {isValid}
            </p>
            <input
              ref={inputRef}
              className="h-full cursor-[inherit] border border-transparent bg-transparent px-2 text-right text-text2 outline-none transition-colors duration-150 ease-in-out focus:cursor-text focus:border-blue-500 focus:text-text1"
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
      {defaultValue !== undefined && (
        <ResetDefaultValue
          value={value}
          defaultValue={defaultValue}
          onClick={() => {
            setInput(`${defaultValue}`)
            setValue(defaultValue)
          }}
        />
      )}
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

  return { value, setValue }
}
