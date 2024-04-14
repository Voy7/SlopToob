'use client'

import { SocketEvent } from '@/lib/enums'
import Icon, { IconNames } from '@/components/ui/Icon'
import Slider from '@/components/ui/Slider'
import styles from './SettingsComponents.module.scss'
import type { ListOption } from '@/typings/types'
import { useEffect, useRef, useState } from 'react'

// Admin panel settings components

export function SettingGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.settingGroup}>{children}</div>
}

export function Header({ icon, children }: { icon: IconNames, children: React.ReactNode }) {
  return <h4 className={styles.header}>{icon ? <Icon name={icon} /> : null}{children}</h4>
}

export function Description({ children }: { children: React.ReactNode }) {
  return <p className={styles.description}>{children}</p>
}

type ToggleProps = {
  label: string,
  value: boolean | null,
  setValue: (value: boolean) => void
}

export function Toggle({ label, value, setValue }: ToggleProps) {
  return (
    <label className={value ? `${styles.toggleOption} ${styles.active}` : styles.toggleOption}>
      {label}
      {value !== null ? (
        <Slider value={value} onChange={event => setValue(event.target.checked)} />
      ) : (
        <Icon name="loading" />
      )}
    </label>
  )
}

type NumberOptionProps = {
  label: string,
  allowFloat?: boolean,
  value: number | null,
  setValue: (value: number) => void
}

export function NumberOption({ label, allowFloat, value, setValue }: NumberOptionProps) {
  const [input, setInput] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInput(value !== null ? `${value}` : null)
    setIsValid(value !== null ? checkIsValid(`${value}`) : null)
  }, [value])

  // Submit when input loses focus
  useEffect(() => {
    if (inputRef.current) {
      const input = inputRef.current
      const onBlur = () => {
        if (input !== document.activeElement) onSubmit()
      }
      input.addEventListener('blur', onBlur)
      return () => input.removeEventListener('blur', onBlur)
    }
  }, [inputRef.current, value])

  function onSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const isValid = checkIsValid(input)
    setIsValid(isValid)
    if (isValid) setValue(Number(input))
  }

  function checkIsValid(value: string | null) {
    if (value === null) return false
    if (allowFloat) return !isNaN(Number(value))
    return Number.isInteger(Number(value))
  }

  return (
    <form onSubmit={onSubmit}>
      <label className={value ? `${styles.numberOption} ${styles.active}` : styles.numberOption}>
        {label}
        {value !== null && input !== null ? (
          <span>
            {!isValid && <p><Icon name="warning" />Invalid value</p>}
            <input ref={inputRef} type="text" value={`${input}`} onChange={event => setInput(event.target.value)} />
          </span>
        ) : (
          <Icon name="loading" />
        )}
      </label>
    </form>
  )
}

type ListOptionProps = {
  value: ListOption | null,
  setValue: (value: string) => void
}

export function ListOption({ value, setValue }: ListOptionProps) {
  if (!value) return (
    <label className={styles.listOption}>
      Loading options...
      <Icon name="loading" />
    </label>
  )

  return (
    <>
      {value.list.map(option => (
        <label
          key={option.id}
          className={option.id === value.selectedID ? `${styles.listOption} ${styles.active}` : styles.listOption}
          onClick={() => setValue(option.id)}
        >
          {option.name}
          {option.id === value.selectedID ? (
            <p><span>Selected</span><Icon name="radio-checked" /></p>
          ) : (
            <Icon name="radio-unchecked" />
          )}
        </label>
      ))}
    </>
  )
}