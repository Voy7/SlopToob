import { useEffect, useRef, useState } from 'react'
import Icon, { IconNames } from '@/components/ui/Icon'
import Slider from '@/components/ui/Slider'
import styles from './SettingsComponents.module.scss'
import type { ListOption } from '@/typings/types'

// Admin panel settings components

export function MainHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold uppercase">{children}</h2>
}

export function SettingGroup({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 w-full rounded-lg border border-border1 p-2">{children}</div>
}

export function Header({ icon, children }: { icon: IconNames; children: React.ReactNode }) {
  return (
    <h4 className={styles.header}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </h4>
  )
}

export function Description({ children }: { children: React.ReactNode }) {
  return <p className={styles.description}>{children}</p>
}

export function Gap() {
  return <div className={styles.gap} />
}

type ToggleProps = {
  label: string
  value: boolean | null
  setValue: (value: boolean) => void
}

export function ToggleOption({ label, value, setValue }: ToggleProps) {
  return (
    <label className={value ? `${styles.toggleOption} ${styles.active}` : styles.toggleOption}>
      {label}
      {value !== null ? (
        <div className={styles.right}>
          <div className={styles.valueLabel}>
            <p key={`${value}`}>{value ? 'Enabled' : 'Disabled'}</p>
            <Slider value={value} onChange={(event) => setValue(event.target.checked)} />
          </div>
        </div>
      ) : (
        <Icon name="loading" className={styles.loadingIcon} />
      )}
    </label>
  )
}

type StringOptionProps = {
  label: string
  value: string | null
  setValue: (value: string) => void
  error?: string | null
}

export function StringOption({ label, value, setValue, error }: StringOptionProps) {
  const [input, setInput] = useState<string | null>(null)
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
      <label className={isEditing ? `${styles.textOption} ${styles.isEditing}` : styles.textOption}>
        {label}
        {value !== null && input !== null ? (
          <div className={styles.right}>
            <div className={styles.valueLabel}>
              <p key={`${error}`} className={typeof error === 'string' ? styles.show : undefined}>
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
        ) : (
          <Icon name="loading" className={styles.loadingIcon} />
        )}
      </label>
    </form>
  )
}

type NumberOptionProps = {
  label: string
  type: 'integer' | 'float' | 'percentage'
  value: number | null
  setValue: (value: number) => void
}

export function NumberOption({ label, type, value, setValue }: NumberOptionProps) {
  const [input, setInput] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<true | null | string>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Update input when value changes from server
  useEffect(() => {
    setInput(value !== null ? `${value}` : null)
    setIsValid(value !== null ? checkIsValid(`${value}`) : null)
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
      <label className={isEditing ? `${styles.textOption} ${styles.isEditing}` : styles.textOption}>
        {label}
        {value !== null && input !== null ? (
          <div className={styles.right}>
            <div className={styles.valueLabel}>
              <p
                key={`${isValid}`}
                className={typeof isValid === 'string' ? styles.show : undefined}>
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
        ) : (
          <Icon name="loading" className={styles.loadingIcon} />
        )}
      </label>
    </form>
  )
}

type ListOptionProps = {
  value: ListOption | null
  setValue: (value: string) => void
}

export function ListOption({ value, setValue }: ListOptionProps) {
  if (!value)
    return (
      <label className={styles.listOption}>
        Loading options...
        <Icon name="loading" className={styles.loadingIcon} />
      </label>
    )

  return (
    <>
      {value.list.map((option) => (
        <label
          key={option.id}
          className={
            option.id === value.selectedID
              ? `${styles.listOption} ${styles.active}`
              : styles.listOption
          }
          onClick={() => setValue(option.id)}>
          {option.name}
          <div className={styles.right}>
            {option.id === value.selectedID ? (
              <div className={styles.valueLabel}>
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

type ButtonOptionProps = {
  label: string
  swapped?: boolean
  children: React.ReactNode
}

export function ButtonOption({ label, swapped, children }: ButtonOptionProps) {
  return (
    <div className={swapped ? `${styles.buttonOption} ${styles.swapped}` : styles.buttonOption}>
      {children}
      {label}
    </div>
  )
}
