'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { JobState, Msg } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon, { IconNames } from '@/components/ui/Icon'
import ClickContextMenu from '@/components/ui/ClickContextMenu'
import ContextMenuButton from '@/components/ui/ContextMenuButton'
import { twMerge } from 'tailwind-merge'
import type { TranscodeClientVideo } from '@/typings/socket'

const states: Record<JobState, { name: string; color: string }> = {
  [JobState.Initializing]: { name: 'Initializing', color: 'gray' },
  [JobState.Idle]: { name: 'Idle', color: 'gray' },
  [JobState.AwaitingTranscode]: { name: 'Awaiting Transcode', color: 'magenta' },
  [JobState.Transcoding]: { name: 'Transcoding', color: 'aqua' },
  [JobState.CleaningUp]: { name: 'Cleaning Up', color: 'orange' },
  [JobState.Finished]: { name: 'Finished', color: 'lime' },
  [JobState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { transcodeQueue } = useAdminContext()

  return (
    <SettingGroup>
      <Header icon="list">Transcoding Jobs ({transcodeQueue.length})</Header>
      <div className="flex flex-col border-l-[1px] border-r-[1px] border-t-[1px] border-border1">
        {transcodeQueue.map((job, index) => (
          <Job key={job.id} job={job} index={index} />
        ))}
      </div>
    </SettingGroup>
  )
}

function Job({ job, index }: { job: TranscodeClientVideo; index: number }) {
  const { socket } = useSocketContext()

  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [showActions, setShowActions] = useState<boolean>(false)

  const percent = Math.round((job.availableSeconds / job.totalSeconds) * 100) || 0

  return (
    <div className="animate-itemFadeIn queueItem cursor-default border-b-[1px] border-border1 p-2">
      <header className="flex items-start justify-between gap-1 overflow-hidden">
        <div className="flex w-full gap-1.5 overflow-hidden">
          <span className="text-base text-text3">{index + 1}.</span>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap">{job.name}</p>
        </div>
        <button
          className="rounded-full p-1 hover:bg-bg2 hover:bg-opacity-50"
          onClick={() => setShowActions(!showActions)}>
          <Icon name="more" />
          <ClickContextMenu placement="right">
            <ContextMenuButton
              icon="admin-panel"
              onClick={() => socket.emit(Msg.AdminDebugJob, job.id)}>
              Print Job Debug
            </ContextMenuButton>
            <ContextMenuButton
              icon="delete"
              onClick={() => socket.emit(Msg.AdminTerminateJob, job.id)}
              className="text-red-500 hover:bg-red-500">
              Terminate Job
            </ContextMenuButton>
          </ClickContextMenu>
        </button>
      </header>
      <div className="flex items-center gap-1.5 pb-1 pt-2">
        <div
          className="h-2 w-2 rounded-full bg-white"
          style={{ background: states[job.state].color }}
        />
        <p className="text-text2">{states[job.state].name}</p>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="absolute h-full bg-white duration-500"
            style={{ width: `${percent}%`, background: states[job.state].color }}></div>
        </div>
        <p className="text-text3">{percent}%</p>
      </div>
      <div
        className={twMerge(
          'my-1 h-0 overflow-hidden rounded-lg bg-bg2 opacity-0 duration-300',
          showDetails && 'opacity-1 h-[150px]' // Pre-defined height
        )}>
        <StatItem icon="arrow-right">Average FPS: -/-</StatItem>
        <StatItem icon="history">Current FPS: {job.fpsRate}</StatItem>
        <StatItem icon="list">Processed Frames: {job.frames.toLocaleString()}</StatItem>
        <StatItem icon="arrow-right">Job ID: {job.id}</StatItem>
      </div>
      <button
        className="w-full rounded-full p-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
        onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
    </div>
  )
}

function StatItem({ icon, children }: { icon: IconNames; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-md px-2 py-1 text-text3">
      <Icon name={icon} />
      {children}
    </div>
  )
}
