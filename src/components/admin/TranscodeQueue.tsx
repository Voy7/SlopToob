'use client'

import { useMemo, useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { JobState, Msg } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon, { IconNames } from '@/components/ui/Icon'
import Thumbnail from '@/components/stream/Thumbnail'
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

  const percent = useMemo(() => {
    return Math.round((job.availableSeconds / job.totalSeconds) * 100) || 0
  }, [job])

  return (
    <div className="animate-fade-in border-b-[1px] border-border1 p-2">
      <div className="flex w-full cursor-default items-center gap-2">
        <span className="w-[1em] shrink-0 text-center text-text3">{index + 1}</span>
        <div className="mr-0.5 shrink-0">
          <Thumbnail src={job.thumbnailURL} height={40} />
        </div>
        <div className="flex w-full flex-col items-start justify-center overflow-hidden">
          <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap" title={job.name}>
            {job.name}
          </p>
          <div key={job.state} className="animate-fade-in flex w-full items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-white"
              style={{ background: states[job.state].color }}
            />
            <p className="whitespace-nowrap text-text2">
              {states[job.state].name}
              {job.state === JobState.Finished && (
                <span className="text-text3"> &bull; {percent}%</span>
              )}
            </p>
            {job.state === JobState.Transcoding && (
              <>
                <div className="relative h-1 w-full max-w-[150px] overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="absolute h-full bg-white duration-500"
                    style={{ width: `${percent}%`, background: states[job.state].color }}></div>
                </div>
                <span className="text-text3">{percent}%</span>
              </>
            )}
            {job.error && (
              <p
                className="overflow-hidden text-ellipsis whitespace-nowrap text-text3"
                title={job.error}>
                &bull; {job.error}
              </p>
            )}
          </div>
        </div>
        <button
          className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
          onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        <button
          className="shrink-0 rounded-full p-1.5 text-lg hover:bg-bg2 hover:bg-opacity-50"
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
      </div>
      <div
        className={twMerge(
          'mt-0 h-0 overflow-hidden rounded-xl bg-bg2 py-0 opacity-0 duration-300',
          showDetails && 'opacity-1 mt-2 h-[135px] py-1' // Pre-defined height
        )}>
        <StatItem icon="history">Target Section: {job.targetSection}</StatItem>
        <StatItem icon="activity">
          Average FPS:{' '}
          {job.isUsingCache ? (
            <>N/A &bull; Using Cache</>
          ) : (
            <>
              {job.averageFpsRate.toLocaleString()}
              {job.currentFpsRate && <> &bull; Current: {job.currentFpsRate.toLocaleString()}</>}
            </>
          )}
        </StatItem>
        <StatItem icon="list">
          Processed Frames:{' '}
          {job.isUsingCache ? <>N/A &bull; Using Cache</> : job.frames.toLocaleString()}
        </StatItem>
        <StatItem icon="arrow-right">Job ID: {job.id}</StatItem>
      </div>
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
