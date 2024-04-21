'use client'

import { SocketEvent } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import useListOption from '@/hooks/useListOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'

export default function SectionMonitor() {
  return (
    <>
      <h2>MONITOR EVENTS</h2>
      <StreamControls />
      <QueueList />
      <TranscodeQueue />
    </>
  )
}