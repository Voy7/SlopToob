'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { VideoState, Msg } from '@/shared/enums'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Icon, { IconNames } from '@/components/ui/Icon'
import Thumbnail from '@/components/stream/Thumbnail'
import ClickActionsMenu from '@/components/ui/ClickActionsMenu'
import MenuActionButton from '@/components/ui/MenuActionButton'
import Modal from '@/components/ui/Modal'
import ManualVideoPicker from '@/components/admin/ManualVideoPicker'
import { twMerge } from 'tailwind-merge'
import type { ClientVideo } from '@/typings/socket'

const states: Record<VideoState, { name: string; color: string }> = {
  [VideoState.NotReady]: { name: 'Not Ready', color: 'gray' },
  [VideoState.Ready]: { name: 'Ready', color: 'magenta' },
  [VideoState.Preparing]: { name: 'Preparing', color: 'aqua' },
  [VideoState.Playing]: { name: 'Playing', color: 'lime' },
  [VideoState.Paused]: { name: 'Paused', color: 'white' },
  [VideoState.Seeking]: { name: 'Seeking', color: 'white' },
  [VideoState.Finished]: { name: 'Finished', color: 'white' },
  [VideoState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList({ omitDetails = false }: { omitDetails?: boolean }) {
  const { queue } = useAdminContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)

  return (
    <>
      <SettingGroup>
        <div className="mb-1 flex items-center justify-between gap-4">
          <Header icon="list">Queue ({queue.length})</Header>
          <button
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
            onClick={() => setShowAddModal(true)}>
            <Icon name="queue-play-next" />
            Add Video Manually
          </button>
        </div>
        {queue.length > 0 ? (
          <div className="flex flex-col border-l-[1px] border-r-[1px] border-t-[1px] border-border1">
            {queue.map((video, index) => (
              <Video key={video.id} video={video} index={index} omitDetails={omitDetails} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-text3">
            <p>No videos in queue.</p>
            <p className="text-sm text-text4">Set the active playlist or add a video manually.</p>
          </div>
        )}
      </SettingGroup>

      <Modal
        title="Add Video Manually"
        isOpen={showAddModal}
        setClose={() => setShowAddModal(false)}
        canEscapeKeyClose={false}>
        <div className="h-[calc(90vh-4rem-2px)] w-[min(90vw,700px)] overflow-y-auto p-2 pb-0">
          <ManualVideoPicker setClose={() => setShowAddModal(false)} />
        </div>
      </Modal>
    </>
  )
}

type VideoProps = {
  video: ClientVideo
  index: number
  omitDetails: boolean
}

function Video({ video, index, omitDetails }: VideoProps) {
  const { socket } = useSocketContext()

  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [showActions, setShowActions] = useState<boolean>(false)

  return (
    <div className="animate-fade-in border-b-[1px] border-border1 p-2">
      <div className="flex w-full cursor-default items-center gap-2">
        {video.isPlaying ? (
          <span
            className="w-[1em] shrink-0 grow-0 text-center text-text3"
            title="Currently Playing">
            <Icon name="play" />
          </span>
        ) : (
          <span className="w-[1em] shrink-0 text-center text-text3">{index}</span>
        )}
        <div className="mr-0.5 shrink-0">
          <Thumbnail src={video.thumbnailURL} height={40} />
        </div>
        <div className="flex w-full flex-col items-start justify-center overflow-hidden">
          <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap" title={video.name}>
            {video.isBumper && (
              <span className="mr-1 rounded-md bg-bg2 px-1 text-xs text-blue-500">Bumper</span>
            )}
            {video.name}
          </p>
          <div key={video.state} className="animate-fade-in flex w-full items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-white"
              style={{ background: states[video.state].color }}
            />
            <p className="whitespace-nowrap text-text2">{states[video.state].name}</p>
            {video.error && (
              <p
                className="overflow-hidden text-ellipsis whitespace-nowrap text-text3"
                title={video.error}>
                &bull; {video.error}
              </p>
            )}
          </div>
        </div>
        {!omitDetails && (
          <button
            className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
            onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
        <button
          className="shrink-0 rounded-full p-1.5 text-lg hover:bg-bg2 hover:bg-opacity-50"
          onClick={() => setShowActions(!showActions)}>
          <Icon name="more" />
          <ClickActionsMenu placement="right">
            {!video.isPlaying && (
              <MenuActionButton
                icon="delete"
                onClick={() => socket.emit(Msg.AdminRemoveQueueVideo, video.id)}
                className="text-red-500 hover:bg-red-500">
                Remove from Queue
              </MenuActionButton>
            )}
            {!omitDetails && (
              <MenuActionButton
                icon="admin-panel"
                onClick={() => socket.emit(Msg.AdminDebugVideo, video.id)}>
                Print Video Debug
              </MenuActionButton>
            )}
          </ClickActionsMenu>
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
