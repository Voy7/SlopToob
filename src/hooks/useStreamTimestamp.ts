import { useEffect, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import parseTimestamp from '@/lib/parseTimestamp'

type Return = {
  currentTimestamp: string,
  totalTimestamp: string,
  currentSeconds: number,
  totalSeconds: number
}

// Hook to get the current stream timestamp
export default function useStreamTimestamp(): Return {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const [timestamp, setTimeStamp] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    function updateTimestamp() {
      if (!('currentSeconds' in streamInfo) || !('totalSeconds' in streamInfo)) return setTimeStamp(0)
      if (!lastStreamUpdateTimestamp) return setTimeStamp(streamInfo.currentSeconds)
      const diff = ((Date.now() - lastStreamUpdateTimestamp) / 1000) + streamInfo.currentSeconds
      setTimeStamp(diff)
    }

    updateTimestamp()

    if (streamInfo.state === StreamState.Playing) interval = setInterval(updateTimestamp, 1000)
    else clearInterval(interval)

    return () => clearInterval(interval)
  }, [streamInfo, lastStreamUpdateTimestamp])

  return {
    currentTimestamp: parseTimestamp(timestamp),
    totalTimestamp: ('totalSeconds' in streamInfo) ? parseTimestamp(streamInfo.totalSeconds) : '0:00',
    currentSeconds: timestamp,
    totalSeconds: ('totalSeconds' in streamInfo) ? streamInfo.totalSeconds : 0
  }
}