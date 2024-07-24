'use client'

import { useSocketContext } from '@/contexts/SocketContext'
import { useAdminContext } from '@/contexts/AdminContext'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import Icon from '@/components/ui/Icon'
import { Msg, StreamState } from '@/lib/enums'
import { twMerge } from 'tailwind-merge'

const actionButtonStyles =
  'flex items-center justify-center p-2 text-[2rem] text-black bg-white rounded-full'

// Admin stream controls
export default function StreamControls() {
  const { socket } = useSocketContext()
  const { streamInfo, lastReceivedPlaylistsDate } = useAdminContext()

  const { currentTimestamp, totalTimestamp } = useStreamTimestamp(
    streamInfo,
    lastReceivedPlaylistsDate
  )

  let name = 'Unknown State'
  if ('name' in streamInfo && streamInfo.name) name = streamInfo.name
  if (streamInfo.state === StreamState.Error) name = streamInfo.error

  const isError = streamInfo.state === StreamState.Error

  return (
    <div className="mb-4 flex items-center justify-start gap-2">
      <ActionButton />
      <button className={actionButtonStyles} onClick={() => socket.emit(Msg.AdminSkipVideo)}>
        <Icon name="skip" />
      </button>
      <div className="ml-2 flex flex-col gap-1 overflow-hidden">
        <h6
          className={twMerge(
            'text-text2 cursor-default overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal',
            isError && 'text-error'
          )}
          title={name}
        >
          {name}
        </h6>
        <p className="text-text3 cursor-default text-sm">
          {currentTimestamp} / {totalTimestamp}
        </p>
      </div>
    </div>
  )
}

function ActionButton() {
  const { socket } = useSocketContext()
  const { streamInfo } = useAdminContext()

  if (streamInfo.state === StreamState.Playing) {
    return (
      <button className={actionButtonStyles} onClick={() => socket.emit(Msg.AdminPauseStream)}>
        <Icon name="pause" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return (
      <button className={actionButtonStyles} onClick={() => socket.emit(Msg.AdminUnpauseStream)}>
        <Icon name="play" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Error) {
    return (
      <button className={twMerge(actionButtonStyles, 'bg-error cursor-not-allowed')}>
        <Icon name="warning" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Loading) {
    return (
      <button className={twMerge(actionButtonStyles, 'cursor-not-allowed')}>
        <Icon name="loading" />
      </button>
    )
  }
}
