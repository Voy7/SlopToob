'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import JumpTo from '@/components/admin/common/JumpTo'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import ScheduleEditor from '@/components/admin/ScheduleEditor'

export default function SectionSchedule() {
  const enableWeeklySchedule = useToggleOption('enableWeeklySchedule')

  return (
    <LoadingBoundary>
      <MainHeader>Weekly Schedule</MainHeader>
      <SettingGroup>
        <Header icon="settings">Schedule Settings</Header>
        <ToggleOption label="Enable Weekly Schedule" {...enableWeeklySchedule} />
        <Description>
          Enable a weekly schedule to automatically play playlists at specific times.
        </Description>
      </SettingGroup>
      <div className="h-2" />
      <JumpTo settingsSection="schedule" icon="settings">
        Go to Schedule Settings
      </JumpTo>
      <div className="h-2" />
      <ScheduleEditor />
    </LoadingBoundary>
  )
}
