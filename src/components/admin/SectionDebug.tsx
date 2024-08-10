'use client'

import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'
import ConsoleLogs from '@/components/admin/ConsoleLogs'

export default function SectionDebug() {
  return (
    <>
      <h2>Dev Monitor Panel</h2>
      <StreamControls />
      <div className="grid grid-cols-2 gap-4">
        <QueueList />
        <TranscodeQueue />
      </div>
      <ConsoleLogs />
    </>
  )
}
