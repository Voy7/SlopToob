'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import VoteSkipButton from '@/components/stream/VoteSkipButton'
import Icon from '@/components/ui/Icon'

// Under video section
export default function InfoBody() {
  const { streamInfo } = useStreamContext()

  const title = 'name' in streamInfo ? streamInfo.name : '[No Video]'
  const isBumper = 'isBumper' in streamInfo ? streamInfo.isBumper : false
  const id = 'path' in streamInfo ? streamInfo.path : 'None'

  return (
    <div className="mx-4 mt-4 grid grid-cols-1 items-center gap-4 border-b border-border1 md:mt-0 md:h-[4.5rem] md:grid-cols-[1fr_calc(var(--chat-width)-2rem)]">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 overflow-hidden">
          {isBumper && (
            <span className="text-uppercase cursor-default rounded-lg bg-[rgb(100,100,255)] p-1.5 text-[1.15rem] font-normal">
              Bumper
            </span>
          )}
          <h2 className="overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-normal">
            {title}
          </h2>
        </div>
        {streamInfo.fromPlaylistName && (
          <p className="mt-[-0.25rem] flex items-center gap-1 text-text3">
            <Icon name="playlist" />
            {streamInfo.fromPlaylistName}
          </p>
        )}
      </div>
      <VoteSkipButton />
    </div>
  )
}
