'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { VideoState, Msg } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon, { IconNames } from '@/components/ui/Icon'
import Thumbnail from '@/components/stream/Thumbnail'
import ClickContextMenu from '@/components/ui/ClickContextMenu'
import ContextMenuButton from '@/components/ui/ContextMenuButton'
import { twMerge } from 'tailwind-merge'
import type { ClientVideo } from '@/typings/socket'

const states: Record<VideoState, { name: string; color: string }> = {
  [VideoState.NotReady]: { name: 'Not Ready', color: 'gray' },
  [VideoState.Ready]: { name: 'Ready', color: 'lime' },
  [VideoState.Preparing]: { name: 'Preparing', color: 'aqua' },
  [VideoState.Playing]: { name: 'Playing', color: 'lime' },
  [VideoState.Paused]: { name: 'Paused', color: 'white' },
  [VideoState.Seeking]: { name: 'Seeking', color: 'white' },
  [VideoState.Finished]: { name: 'Finished', color: 'white' },
  [VideoState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { queue } = useAdminContext()

  return (
    <SettingGroup>
      <Header icon="list">Queue ({queue.length})</Header>
      <div className="flex flex-col border-l-[1px] border-r-[1px] border-t-[1px] border-border1">
        {queue.map((video, index) => (
          <Video key={video.id} video={video} index={index} />
        ))}
      </div>
    </SettingGroup>
  )
}

function Video({ video, index }: { video: ClientVideo; index: number }) {
  const { socket } = useSocketContext()

  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [showActions, setShowActions] = useState<boolean>(false)

  return (
    <div className="border-b-[1px] border-border1 p-2">
      <div className="animate-itemFadeIn flex w-full cursor-default items-center gap-2">
        {video.isPlaying ? (
          <span className="w-[1em] text-center text-text3" title="Currently Playing">
            <Icon name="play" />
          </span>
        ) : (
          <span className="w-[1em] text-center text-text3">{index}</span>
        )}
        <Thumbnail src={video.thumbnailURL} height={40} />
        <div className="flex w-full flex-col items-start justify-center overflow-hidden">
          <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap" title={video.name}>
            {video.name}
          </p>
          <div className="flex w-full items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 rounded-full bg-white"
              style={{ background: states[video.state].color }}
            />
            <p className="text-text2">{states[video.state].name}</p>
          </div>
        </div>
        <button
          className="whitespace-nowrap rounded-lg px-2 py-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
          onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        <button
          className="rounded-full p-1.5 text-lg hover:bg-bg2 hover:bg-opacity-50"
          onClick={() => setShowActions(!showActions)}>
          <Icon name="more" />
          <ClickContextMenu placement="right">
            <ContextMenuButton
              icon="admin-panel"
              onClick={() => socket.emit(Msg.AdminDebugVideo, video.id)}>
              Print Video Debug
            </ContextMenuButton>
          </ClickContextMenu>
        </button>
      </div>
      <div
        className={twMerge(
          'mt-0 h-0 overflow-hidden rounded-xl bg-bg2 py-0 opacity-0 duration-300',
          showDetails && 'opacity-1 mt-2 h-[75px] py-1' // Pre-defined height
        )}>
        <StatItem icon="video-file">Video ID: {video.id}</StatItem>
        <StatItem icon="arrow-right">Linked Job ID: {video.jobID}</StatItem>
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
