'use client'

import { useSocketContext } from '@/contexts/SocketContext'
import MenuActionButton from '@/components/ui/MenuActionButton'
import Thumbnail from '@/components/stream/Thumbnail'
import { Msg } from '@/shared/enums'
import type { AddQueueVideoPayload } from '@/typings/socket'

type Props = {
  path: string
  isBumper?: boolean
  onClick: Function
}

export default function VideoPickerContextMenu({ path, isBumper, onClick }: Props) {
  const { socket } = useSocketContext()

  function addToQueue(toStart: boolean, skipCurrent = false) {
    const payload: AddQueueVideoPayload = {
      videoPath: path,
      toStart,
      skipCurrent,
      isBumper
    }
    socket.emit(Msg.AdminAddQueueVideo, payload)
    onClick()
  }

  return (
    <>
      <MenuActionButton icon="queue-play-next" onClick={() => addToQueue(true)}>
        Play Next
      </MenuActionButton>
      <MenuActionButton icon="playlist" onClick={() => addToQueue(false)}>
        Add to Queue
      </MenuActionButton>
      <hr className="my-1 border-border1" />
      <MenuActionButton
        icon="skip"
        onClick={() => addToQueue(true, true)}
        className="text-red-500 hover:bg-red-500">
        Play Right Now
      </MenuActionButton>
      <hr className="my-1 border-border1" />
      <div className="animate-fade-in mt-2 flex w-full justify-center">
        <Thumbnail src={`/thumbnails/${path}`} height={90} />
      </div>
    </>
  )
}
