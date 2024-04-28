'use client'

import Button from '@/components/ui/Button'
import styles from './VoteSkipButton.module.scss'
import { useStreamContext } from '@/contexts/StreamContext'
import { useEffect, useState } from 'react'

// Vote skip button
export default function VoteSkipButton() {
  const { streamInfo } = useStreamContext()

  const [allowedInSeconds, setAllowedInSeconds] = useState<number>(-1)

  useEffect(() => {
    if (streamInfo.voteSkip.allowedInSeconds <= -1) {
      setAllowedInSeconds(-1)
      return
    }

    setAllowedInSeconds(Math.floor(streamInfo.voteSkip.allowedInSeconds))

    // Subtract one second every second
    const interval = setInterval(() => {
      setAllowedInSeconds(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [streamInfo.voteSkip])

  if (!streamInfo.voteSkip.isEnabled) {
    return <Button style="normal" icon="skip" active={false}>Vote Skipping Disabled</Button>    
  }

  if (!streamInfo.voteSkip.isAllowed && streamInfo.voteSkip.allowedInSeconds <= -1) {
    return <Button style="normal" icon="skip" active={false}>Vote Skip &bull; Wait</Button>
  }

  
  if (!streamInfo.voteSkip.isAllowed) {
    return <Button style="normal" icon="skip">Vote Skip &bull; {allowedInSeconds}s</Button>
  }

  return <Button style="normal" icon="skip">Vote Skip &bull; {streamInfo.voteSkip.currentCount}/{streamInfo.voteSkip.requiredCount}</Button>
}