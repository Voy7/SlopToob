'use client'

import { SocketEvent } from '@/lib/enums'
import Icon, { IconNames } from '@/components/ui/Icon'
import Slider from '@/components/ui/Slider'
import styles from './SettingsComponents.module.scss'
import type { ListOption } from '@/typings/types'

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
  if (value === null) return <p>LOADING...</p>

  return (
    <label className={value ? `${styles.option} ${styles.active}` : styles.option}>
      {label}
      <Slider
        value={value}
        onChange={event => setValue(event.target.checked)}
      />
    </label>
  )
}

type ListOptionProps = {
  value: ListOption | null,
  setValue: (value: string) => void
}

export function ListOption({ value, setValue }: ListOptionProps) {
  if (!value) return <p>LOADING...</p>

  return (
    <>
      {value.list.map(option => (
        <label
          key={option.id}
          className={option.id === value.selectedID ? `${styles.option} ${styles.active}` : styles.option}
          onClick={() => setValue(option.id)}
        >
          {option.name}
          {option.id === value.selectedID && (
            <>SELECTED <Icon name="check" /></>
          )}
        </label>
      ))}
    </>
  )
}