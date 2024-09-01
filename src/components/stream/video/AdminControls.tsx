'use client'

import Icon from '@/components/ui/Icon'
import { useSocketContext } from '@/contexts/SocketContext'
import { StreamState, Msg } from '@/lib/enums'
import HoverTooltip from '../../ui/HoverTooltip'
import { twMerge } from 'tailwind-merge'
import { useAdminContext } from '@/contexts/AdminContext'

export default function AdminControls() {
  const { socket } = useSocketContext()

  return (
    <div className="flex items-center rounded-xl border border-blue-500 border-opacity-50 bg-slate-500 bg-opacity-25 p-1">
      <ActionButton onClick={() => socket.emit(Msg.AdminSeekStepBackward, 10)}>
        <HoverTooltip placement="top" offset={22}>
          Rewind 10s (Admin only)
        </HoverTooltip>
        <Icon name="back-10" />
      </ActionButton>
      <ActionButton onClick={() => socket.emit(Msg.AdminPreviousVideo)}>
        <HoverTooltip placement="top" offset={22}>
          Previous Video (Admin only)
        </HoverTooltip>
        <Icon name="previous" />
      </ActionButton>
      <PausePlayButton />
      <ActionButton onClick={() => socket.emit(Msg.AdminSkipVideo)}>
        <HoverTooltip placement="top" offset={22}>
          Skip Video (Admin only)
        </HoverTooltip>
        <Icon name="skip" />
      </ActionButton>
      <ActionButton onClick={() => socket.emit(Msg.AdminSeekStepForward, 10)}>
        <HoverTooltip placement="top" offset={22}>
          Fast Forward 10s (Admin only) Fast Forward 10s (Admin only)
        </HoverTooltip>
        <Icon name="forward-10" />
      </ActionButton>
    </div>
  )
}

function ActionButton({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={twMerge(
        'rounded-full p-2 text-3xl text-blue-300 transition-colors hover:bg-blue-500 hover:bg-opacity-50 hover:text-white',
        className
      )}
    />
  )
}

function PausePlayButton() {
  const { socket } = useSocketContext()
  const { streamInfo } = useAdminContext()

  if (streamInfo.state === StreamState.Playing) {
    return (
      <ActionButton onClick={() => socket.emit(Msg.AdminPauseStream)}>
        <HoverTooltip placement="top" offset={22}>
          Pause Stream (Admin only)
        </HoverTooltip>
        <Icon name="pause" />
      </ActionButton>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return (
      <ActionButton onClick={() => socket.emit(Msg.AdminUnpauseStream)}>
        <HoverTooltip placement="top" offset={22}>
          Unpause Stream (Admin only)
        </HoverTooltip>
        <Icon name="play" />
      </ActionButton>
    )
  }

  return (
    <ActionButton className="cursor-not-allowed text-red-500 hover:bg-red-500">
      <HoverTooltip placement="top" offset={22}>
        Loading
      </HoverTooltip>
      <Icon name="loading" />
    </ActionButton>
  )
}
