import { useEffect, useState } from 'react'
import { StreamState } from '@/lib/enums'
import parseTimestamp from '@/lib/parseTimestamp'
import type { BaseStreamInfo } from '@/typings/socket'

type Return = {
  currentTimestamp: string
  totalTimestamp: string
  currentSeconds: number
  totalSeconds: number
}

// Hook to get the current stream timestamp
export default function useStreamTimestamp(
  streamInfo: BaseStreamInfo,
  lastStreamUpdateTimestamp: number | null
): Return {
  const [timestamp, setTimeStamp] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    function updateTimestamp() {
      if (!('currentSeconds' in streamInfo) || !('totalSeconds' in streamInfo))
        return setTimeStamp(0)
      if (streamInfo.state !== StreamState.Playing) return setTimeStamp(streamInfo.currentSeconds)
      if (!lastStreamUpdateTimestamp) return setTimeStamp(streamInfo.currentSeconds)
      const diff = (Date.now() - lastStreamUpdateTimestamp) / 1000 + streamInfo.currentSeconds
      setTimeStamp(diff > streamInfo.totalSeconds ? streamInfo.totalSeconds : diff)
    }

    updateTimestamp()

    if (streamInfo.state === StreamState.Playing) interval = setInterval(updateTimestamp, 1000)

    return () => clearInterval(interval)
  }, [streamInfo, lastStreamUpdateTimestamp])

  return {
    currentTimestamp: parseTimestamp(timestamp),
    totalTimestamp: 'totalSeconds' in streamInfo ? parseTimestamp(streamInfo.totalSeconds) : '0:00',
    currentSeconds: timestamp,
    totalSeconds: 'totalSeconds' in streamInfo ? streamInfo.totalSeconds : 0
  }
}
