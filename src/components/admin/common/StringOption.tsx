'use client'

import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type StringOptionProps = {
  label: string
  value: string | null
  setValue: (value: string) => void
  error?: string | null
}

export function StringOption({ label, value, setValue, error }: StringOptionProps) {
  if (value === null) return null

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
    <form onSubmit={onSubmit}>
      <label className="flex cursor-pointer items-center justify-between gap-4 bg-bg2 px-1.5 py-0.5 hover:bg-bg3">
        {label}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <p
              key={`${error}`}
              className={twMerge(
                'flex translate-x-4 scale-90 transform items-center gap-1 text-red-500 opacity-90 transition-all duration-150 ease-in-out',
                typeof error === 'string' && 'translate-x-0 scale-100 opacity-100'
              )}>
              <Icon name="warning" />
              {error}
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
