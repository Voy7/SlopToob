'use client'

import useToggleOption from '@/hooks/useToggleOption'
import {
  MainHeader,
  SettingGroup,
  Header,
  Description,
  ToggleOption
} from '@/components/admin/SettingsComponents'
import SubSectionSelector from '@/components/ui/SubSectionSelector'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'
import ConsoleLogs from '@/components/admin/ConsoleLogs'
import { useState } from 'react'

export default function SectionDebug() {
  const [subSection, setSubSection] = useState('queues')
  return (
    <>
      <MainHeader>Developer Debug</MainHeader>
      <SubSectionSelector
        value={subSection}
        setValue={setSubSection}
        sections={[
          { id: 'queues', label: 'Queues', icon: 'list' },
          { id: 'console', label: 'Console Logs', icon: 'admin-panel' }
        ]}
      />
      <div className="mt-4">
        {subSection === 'queues' && (
          <>
            <StreamControls />
            <QueueList />
            <TranscodeQueue />
          </>
        )}
        {subSection === 'console' && <ConsoleLogs />}
      </div>
    </>
  )
}
