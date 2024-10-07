'use client'

import { useState } from 'react'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SubSectionSelector from '@/components/ui/SubSectionSelector'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'
import ConsoleLogs from '@/components/admin/ConsoleLogs'

export default function SectionDebug() {
  const [subSection, setSubSection] = useState('queues')
  return (
    <LoadingBoundary>
      <MainHeader>Developer Debug</MainHeader>
      <SubSectionSelector
        value={subSection}
        setValue={setSubSection}
        sections={[
          { id: 'queues', label: 'Queues', icon: 'list' },
          { id: 'console', label: 'Console Logs', icon: 'admin-panel' }
        ]}
      />
      <div className="mt-6">
        {subSection === 'queues' && (
          <>
            <StreamControls />
            <QueueList />
            <div className="h-4" />
            <TranscodeQueue />
          </>
        )}
        {subSection === 'console' && <ConsoleLogs />}
      </div>
    </LoadingBoundary>
  )
}
