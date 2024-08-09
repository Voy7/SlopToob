'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { JobState } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon, { IconNames } from '@/components/ui/Icon'
import ContextMenu from '@/components/ui/ContextMenu'
import ContextMenuButton from '@/components/ui/ContextMenuButton'
import { twMerge } from 'tailwind-merge'

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
        {transcodeQueue.map((video, index) => {
          const [showDetails, setShowDetails] = useState<boolean>(false)
          const [showActions, setShowActions] = useState<boolean>(false)
          const percent = Math.round((video.availableSeconds / video.totalSeconds) * 100) || 0
          return (
            <div
              key={video.name}
              className="animate-itemFadeIn queueItem cursor-default border-b-[1px] border-border1 p-2"
            >
              <header className="flex items-start justify-between gap-1">
                <div className="flex gap-1">
                  <span className="text-base text-text3">{index + 1}.</span>
                  <p>{video.name}</p>
                </div>
                <button
                  className="rounded-full p-1 hover:bg-bg2 hover:bg-opacity-50"
                  onClick={() => setShowActions(!showActions)}
                >
                  <Icon name="settings" />
                  <ContextMenu show={showActions}>
                    <ContextMenuButton icon="admin-panel" onClick={() => {}}>
                      Print Job Debug
                    </ContextMenuButton>
                    <ContextMenuButton icon="admin-panel" onClick={() => {}}>
                      Print Job Debug
                    </ContextMenuButton>
                    <ContextMenuButton icon="admin-panel" onClick={() => {}}>
                      Print Job Debug
                    </ContextMenuButton>
                    <ContextMenuButton
                      icon="delete"
                      onClick={() => {}}
                      className="text-red-500 hover:bg-red-500"
                    >
                      Terminate Job
                    </ContextMenuButton>
                  </ContextMenu>
                </button>
              </header>
              <div className="flex items-center gap-1.5 pb-1 pt-2">
                <div
                  className="h-2 w-2 rounded-full bg-white"
                  style={{ background: states[video.state].color }}
                />
                <p className="text-text2">{states[video.state].name}</p>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="absolute h-full bg-white duration-500"
                    style={{ width: `${percent}%`, background: states[video.state].color }}
                  ></div>
                </div>
                <p className="text-text3">{percent}%</p>
              </div>
              <div
                className={twMerge(
                  'my-1 h-0 overflow-hidden rounded-lg bg-bg2 opacity-0 duration-300',
                  showDetails && 'opacity-1 h-[150px]' // Pre-defined height
                )}
              >
                <StatItem icon="arrow-right">Average FPS: -/-</StatItem>
                <StatItem icon="history">Current FPS: {video.fpsRate}</StatItem>
                <StatItem icon="list">Processed Frames: {video.frames.toLocaleString()}</StatItem>
                <StatItem icon="arrow-right">Job ID: {video.id}</StatItem>
              </div>
              <button
                className="w-full rounded-full p-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          )
        })}
      </div>
    </SettingGroup>
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
