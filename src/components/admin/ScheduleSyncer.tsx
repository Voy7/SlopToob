'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'

export default function ScheduleSyncer() {
  const { schedule } = useAdminContext()
  const { socket } = useSocketContext()

  if (!schedule.isEnabled || !schedule.canBeSynced) return null

  if (schedule.isSynced) {
    return (
      <div className="flex w-full items-center gap-4">
        <p className="w-full">Playlist Scheduler is synced.</p>
        <div className="rounded-full border border-lime-700 bg-bg3 p-1 text-lime-700">
          <Icon name="check" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-4">
      <p className="w-full">Playlist Scheduler is not synced.</p>
      <Button style="main" icon="sync" onClick={() => socket.emit(Msg.AdminScheduleSync)}>
        Sync Now
      </Button>
    </div>
  )
}
