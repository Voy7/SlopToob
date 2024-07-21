'use client'

import {
  SettingGroup,
  Header,
  Description,
  ToggleOption,
  ListOption,
  NumberOption
} from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'

export default function SectionMonitor() {
  return (
    <>
      <h2>Dev Monitor Panel</h2>
      <StreamControls />
      <QueueList />
      <TranscodeQueue />
    </>
  )
}
