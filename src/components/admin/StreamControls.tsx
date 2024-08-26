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
  const { streamInfo, lastStreamUpdateTimestamp } = useAdminContext()

  const { currentTimestamp, totalTimestamp } = useStreamTimestamp(
    streamInfo,
    lastStreamUpdateTimestamp
  )

  let name = 'Unknown State'
  if ('name' in streamInfo && streamInfo.name) name = streamInfo.name
  if (streamInfo.state === StreamState.Error) name = streamInfo.error

  const isError = streamInfo.state === StreamState.Error

  return (
    <div className="mb-4 flex items-center justify-start gap-2">
      <button className={actionButtonStyles} onClick={() => socket.emit(Msg.AdminPreviousVideo)}>
        <Icon name="previous" />
      </button>
      <ActionButton />
      <button className={actionButtonStyles} onClick={() => socket.emit(Msg.AdminSkipVideo)}>
        <Icon name="skip" />
      </button>
      <div className="ml-2 flex flex-col overflow-hidden">
        <h6
          className={twMerge(
            'cursor-default overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal text-text2',
            isError && 'text-error'
          )}
          title={name}>
          {name}
        </h6>
        <p className="cursor-default text-sm text-text3">
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
      <button className={twMerge(actionButtonStyles, 'cursor-not-allowed bg-error')}>
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
