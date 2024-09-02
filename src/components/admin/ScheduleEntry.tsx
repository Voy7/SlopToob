'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { daysOfWeek } from '@/lib/daysOfWeek'
import Icon from '@/components/ui/Icon'
import SelectDropdown from '@/components/ui/SelectDropdown'
import SelectItem from '@/components/ui/SelectItem'
import type { ScheduleEntryOptions } from '@/typings/types'
import type { ClientScheduleEntry } from '@/typings/socket'
import { twMerge } from 'tailwind-merge'

// function parseNumberInput(value: number, max: number): string {
//   if (value > max) value = max
//   const str = value.toString()
//   if (str.length > 2) return str.slice(0, 2)
//   if (str.length === 1) return `0${str}`
//   return str
// }

type Props = {
  entry?: ClientScheduleEntry
  onChange: (options: ScheduleEntryOptions) => void
}

export default function ScheduleEntry({ entry, onChange }: Props) {
  const { schedule, playlists } = useAdminContext()

  const [isEnabled, setIsEnabled] = useState<boolean>(entry ? entry.isEnabled : true)
  const [playlistID, setPlaylistID] = useState<string>(
    entry ? entry.playlistID : playlists[0].id || ''
  )
  const [day, setDay] = useState<number>(entry ? entry.dayOfWeek : 1)
  const [hours, setHours] = useState<number>(entry ? entry.hours : 0)
  const [minutes, setMinutes] = useState<number>(entry ? entry.minutes : 0)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  useEffect(() => {
    if (!entry) {
      onChange({ isEnabled, playlistID, day, hours, minutes })
      return
    }

    // Debounce the onChange event
    if (isEditing) return
    const timeout = setTimeout(() => {
      onChange({ isEnabled, playlistID, day, hours, minutes })
    }, 250)
    return () => clearTimeout(timeout)
  }, [isEnabled, playlistID, day, hours, minutes, isEditing])

  const playlistName = playlists.find((p) => p.id === playlistID)?.name || '(Deleted Playlist)'

  return (
    <div className="flex w-full min-w-max items-center gap-2 bg-bg2 px-2">
      <div
        className={twMerge(
          'h-[32px] w-0.5 bg-slate-800',
          schedule.activeEntryID === entry?.id && 'bg-lime-700'
        )}
      />
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={(e) => setIsEnabled(e.target.checked)}
        className="ml-2.5 mr-3 h-4 w-4"
      />
      <div className="w-[250px]">
        <SelectDropdown label={playlistName} icon="playlist">
          {playlists.map((playlist) => (
            <SelectItem
              key={playlist.id}
              active={playlist.id === playlistID}
              label={playlist.name}
              subLabel={`${playlist.videoPaths.length.toLocaleString()} Videos`}
              onClick={() => setPlaylistID(playlist.id)}
              className="py-1.5"
            />
          ))}
        </SelectDropdown>
      </div>
      <div className="w-[140px]">
        <SelectDropdown
          label={daysOfWeek.find((d) => d.index === day)?.name || 'Unknown'}
          icon="calendar">
          {daysOfWeek.map((weekDay) => (
            <SelectItem
              key={weekDay.index}
              active={weekDay.index === day}
              label={weekDay.name}
              onClick={() => setDay(weekDay.index)}
              className="py-1.5"
            />
          ))}
        </SelectDropdown>
      </div>
      <DualNumberInput
        value={hours}
        setter={setHours}
        max={23}
        step={1}
        setIsEditing={setIsEditing}
      />
      <span className="text-bold w-1 cursor-default text-center text-xl text-text3">:</span>
      <DualNumberInput
        value={minutes}
        setter={setMinutes}
        max={59}
        step={5}
        setIsEditing={setIsEditing}
      />
    </div>
  )
}

type NumberInputProps = {
  setter: React.Dispatch<React.SetStateAction<number>>
  max: number
  value: number
  step: number
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
} & React.InputHTMLAttributes<HTMLInputElement>

function DualNumberInput({ setter, max, value, step, setIsEditing, ...props }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="group relative h-full w-14 border-none bg-bg1">
      <input
        ref={inputRef}
        value={value}
        type="number"
        className="h-full w-full appearance-none bg-bg1 p-1 text-left outline outline-[1px] outline-border1 focus:outline-blue-500"
        style={{ MozAppearance: 'textfield' }}
        onFocus={(event) => {
          setIsEditing(true)
          event.target.select()
        }}
        onBlur={() => setIsEditing(false)}
        onChange={(event) => {
          function computeValue() {
            let newValue = parseInt(event.target.value).toString()
            if (!newValue.startsWith(value.toString())) {
              newValue = newValue.slice(0, 2)
            }
            if (newValue.length > 2) {
              // Keep only the last two characters
              newValue = newValue.slice(-2)
            }
            const int = parseInt(newValue)
            if (isNaN(int)) return 0
            if (int > max) return max
            return int
          }
          const newValue = computeValue()
          const newValueStr = newValue.toString()
          event.target.value = newValueStr.length > 1 ? newValueStr : `0${newValueStr}`

          setter(newValue)
        }}
        {...props}
      />
      <div className="absolute right-0 top-0 flex h-full flex-col bg-red-500">
        <button
          title="Increment Up"
          onClick={() => {
            inputRef.current?.focus()
            let newValue = value + step
            if (newValue > max) newValue = max
            setter(newValue)
          }}
          className="h-1/2 w-full bg-bg2 px-1 text-center text-text2 hover:bg-bg3 hover:text-white active:bg-bg4">
          <Icon name="up-chevron" />
        </button>
        <button
          title="Increment Down"
          onClick={() => {
            inputRef.current?.focus()
            let newValue = value - step
            if (newValue === 54) newValue = 55
            if (newValue < 0) newValue = 0
            setter(newValue)
          }}
          className="h-1/2 w-full bg-bg2 px-1 text-center text-text2 hover:bg-bg3 hover:text-white active:bg-bg4">
          <Icon name="down-chevron" />
        </button>
      </div>
    </div>
  )
}
