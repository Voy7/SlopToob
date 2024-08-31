'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import SelectDropdown from '@/components/ui/SelectDropdown'

export default function ScheduleDisplay() {
  const { scheduleDisplay } = useStreamContext()

  if (!scheduleDisplay) return null

  return (
    <div className="m-4 rounded-xl bg-bg2 p-4">
      <p>SCHEDULE DISPLAY : {scheduleDisplay?.inSync.toString()}</p>
      <SelectDropdown label="Schedule Display">
        <span className="block w-full">AAAAAAAAA</span>
        <span className="block w-full">BBBBBBBBB</span>
        <span className="block w-full">CCCCCCCCC</span>
        <span className="block w-full">DDDDDDDDD</span>
      </SelectDropdown>
    </div>
  )
}
