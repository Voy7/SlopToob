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
      <div className="flex w-full min-w-fit cursor-default items-center gap-2 overflow-hidden">
        <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-lime-700">
          <Icon name="calendar" />
          <HoverTooltip placement="bottom">Playlist Scheduler Status: Synced</HoverTooltip>
        </div>
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
          Playlist Scheduler is synced.
        </p>
        <Button variant="normal" icon="check" disabled>
          Synced
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-fit cursor-default items-center gap-2 overflow-hidden">
      <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-red-400">
        <Icon name="calendar" />
        <HoverTooltip placement="bottom">Playlist Scheduler Status: Not Synced</HoverTooltip>
      </div>
      <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
        Playlist Scheduler not synced.
      </p>
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
