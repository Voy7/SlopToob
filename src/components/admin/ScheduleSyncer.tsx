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
      <div className="flex w-max cursor-default items-center gap-2 overflow-hidden">
        <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-lime-700">
          <Icon name="calendar" />
          <HoverTooltip placement="bottom">Playlist Scheduler Status: Synced</HoverTooltip>
        </div>
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
          Playlist Scheduler is synced.
        </p>
        <Button style="normal" icon="check" className="text-lime-500" active={false}>
          Synced
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-max cursor-default items-center gap-2 overflow-hidden">
      <div className="shrink-0 rounded-full bg-bg2 p-1 text-xl text-red-400">
        <Icon name="calendar" />
        <HoverTooltip placement="bottom">Playlist Scheduler Status: Not Synced</HoverTooltip>
      </div>
      <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
        Playlist Scheduler is not synced.
      </p>
      <Button style="main" icon="sync" onClick={() => socket.emit(Msg.AdminScheduleSync)}>
        Sync Now
      </Button>
    </div>
  )
}
