'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'

export default function ScheduleSyncer() {
  const { schedule } = useAdminContext()
  const { socket } = useSocketContext()

  if (!schedule.isEnabled || !schedule.canBeSynced) return null

  if (schedule.isSynced) {
    return (
      <div className="flex cursor-default items-center gap-4 overflow-hidden">
        <div className="flex w-full items-center gap-2">
          <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-lime-700">
            <Icon name="calendar" />
            <HoverTooltip placement="top">Playlist Scheduler Status: Synced</HoverTooltip>
          </div>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-text2">
            <span className="block sm:hidden">Is synced.</span>
            <span className="hidden sm:block">Playlist Scheduler is synced.</span>
          </p>
        </div>
        <Button variant="normal" icon="check" disabled>
          Synced
        </Button>
      </div>
    )
  }

  return (
    <div className="flex cursor-default items-center gap-4 overflow-hidden">
      <div className="flex w-full items-center gap-2">
        <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-red-400">
          <Icon name="calendar" />
          <HoverTooltip placement="top">Playlist Scheduler Status: Not Synced</HoverTooltip>
        </div>
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-text2">
          <span className="block sm:hidden">Not synced.</span>
          <span className="hidden sm:block">Playlist Scheduler not synced.</span>
        </p>
      </div>
      <Button
        variant="main"
        icon="sync"
        className="border-green-500 bg-green-600 hover:bg-green-500"
        onClick={() => socket.emit(Msg.AdminScheduleSync)}>
        Sync Now
      </Button>
    </div>
  )
}
