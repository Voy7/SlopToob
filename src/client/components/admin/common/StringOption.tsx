'use client'

import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import ResetDefaultValue from '@/components/admin/ResetDefaultButton'
import { twMerge } from 'tailwind-merge'

type StringOptionProps = {
  label: string
  value: string | null
  setValue: (value: string) => void
  error?: string | null
  defaultValue?: string
}

export function StringOption({ label, value, setValue, error, defaultValue }: StringOptionProps) {
  if (value === null) return <div data-loading />

  const [input, setInput] = useState<string>(`${value}`)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Update input when value changes from server
  useEffect(() => {
    setInput(value)
  }, [value])

  // Update width of input based on value
  useEffect(() => {
    if (!inputRef.current) return
    const input = inputRef.current
    input.style.width = `calc(${input.value.length}ch + 1em)`
  }, [input])

  function onSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!input) return
    setValue(input)
    inputRef.current?.blur()
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
              key={`${error}`}
              className={twMerge(
                'flex translate-x-4 scale-90 transform items-center gap-1 text-red-500 opacity-0 transition-all duration-150 ease-in-out',
                typeof error === 'string' && 'translate-x-0 scale-100 opacity-100'
              )}>
              <Icon name="warning" />
              {error}
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
