'use client'

import { timezones } from '@/lib/timezones'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import { useNumberOption } from '@/components/admin/common/NumberOption'
import SelectDropdown from '@/components/ui/SelectDropdown'
import SelectItem from '@/components/ui/SelectItem'
import ScheduleEditor from '@/components/admin/ScheduleEditor'

export default function SectionSchedule() {
  const enableWeeklySchedule = useToggleOption('enableWeeklySchedule')
  const weeklyScheduleUTCOffset = useNumberOption('weeklyScheduleUTCOffset')

  const showWeeklySchedule = useToggleOption('showWeeklySchedule')
  const showWeeklyScheduleIfUnsynced = useToggleOption('showWeeklyScheduleIfUnsynced')
  const showWeeklyScheduleTimemarks = useToggleOption('showWeeklyScheduleTimemarks')

  return (
    <LoadingBoundary>
      <MainHeader>Weekly Schedule</MainHeader>
      <SettingGroup>
        <Header icon="settings">Schedule Settings</Header>
        <ToggleOption label="Enable Weekly Schedule" {...enableWeeklySchedule} />
        <Description>
          Enable a weekly schedule to automatically play playlists at specific times.
        </Description>
        <div className="h-4" />
        <SelectDropdown
          label={`Timezone: ${timezones.find((t) => t.offset === weeklyScheduleUTCOffset.value)?.name || 'Unknown'}`}
          icon="history">
          {timezones.map((timezone) => (
            <SelectItem
              key={timezone.offset}
              active={timezone.offset === weeklyScheduleUTCOffset.value}
              label={timezone.name}
              onClick={() => weeklyScheduleUTCOffset.setValue(timezone.offset)}
              className="py-1.5"
            />
          ))}
        </SelectDropdown>
        <Description>
          Set the timezone for the playlist scheduler. &bull; (Aprroximate time:{' '}
          {currentTimeDisplay(weeklyScheduleUTCOffset.value || 0)})
        </Description>
      </SettingGroup>
      <ScheduleEditor />
      <SettingGroup>
        <Header icon="display">Scheduler Display Settings</Header>
        <ToggleOption label="Show Weekly Schedule" {...showWeeklySchedule} />
        <Description>Display the playlist schedule below the video.</Description>
        <div className="h-4" />
        <ToggleOption label="Show Weekly Schedule If Unsynced" {...showWeeklyScheduleIfUnsynced} />
        <Description>Display the playlist schedule even if it is not synced.</Description>
        <div className="h-4" />
        <ToggleOption label="Show Weekly Schedule Timemarks" {...showWeeklyScheduleTimemarks} />
        <Description>
          Show timestamps on playlist schedule display. Will only show the day if disabled.
        </Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}

function currentTimeDisplay(offset: number): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const local = new Date(utc + 3600000 * offset)
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
