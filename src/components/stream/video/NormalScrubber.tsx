'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'

export default function NormalScrubber() {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const { currentSeconds, totalSeconds } = useStreamTimestamp(streamInfo, lastStreamUpdateTimestamp)

  return (
    <div className="h-[0.5rem] w-full bg-[rgba(136,136,136,0.5)]">
      <div
        className="h-full bg-blue-500 transition-[width] duration-150"
        style={{ width: `${(currentSeconds / totalSeconds) * 100}%` }}
      />
    </div>
  )
}
