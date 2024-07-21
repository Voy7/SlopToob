'use client'

import Button from '@/components/ui/Button'
import styles from './VoteSkipButton.module.scss'
import { useStreamContext } from '@/contexts/StreamContext'
import { useEffect, useState } from 'react'
import { Msg } from '@/lib/enums'
import useSocketOn from '@/hooks/useSocketOn'

// Vote skip button
export default function VoteSkipButton() {
  const { socket, streamInfo } = useStreamContext()

  const [hasVoted, setHasVoted] = useState<boolean>(false)
  const [allowedInSeconds, setAllowedInSeconds] = useState<number>(-1)

  useEffect(() => {
    if (streamInfo.voteSkip.allowedInSeconds <= -1) {
      setAllowedInSeconds(-1)
      setHasVoted(false)
      return
    }

    setAllowedInSeconds(Math.floor(streamInfo.voteSkip.allowedInSeconds))

    // Subtract one second every second
    const interval = setInterval(() => {
      setAllowedInSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [streamInfo.voteSkip])

  useSocketOn<boolean>(Msg.VoteSkipStatus, (hasVoted) => {
    setHasVoted(hasVoted)
  })

  function submitVote() {
    if (hasVoted) socket.emit(Msg.VoteSkipRemove)
    else socket.emit(Msg.VoteSkipAdd)
  }

  // Vote skipping entirely disabled
  if (!streamInfo.voteSkip.isEnabled) {
    return (
      <Button data-vote-button style="normal" icon="skip" active={false}>
        Vote Skipping Disabled
      </Button>
    )
  }

  // Vote skip not ready yet
  if (!streamInfo.voteSkip.isAllowed && streamInfo.voteSkip.allowedInSeconds <= -1) {
    return (
      <Button data-vote-button style="normal" icon="skip" active={false}>
        Vote Skip &bull; Wait
      </Button>
    )
  }

  // Vote skip countdown to be allowed
  if (!streamInfo.voteSkip.isAllowed) {
    return (
      <Button data-vote-button style="normal" icon="skip">
        Vote Skip &bull; <span key={`s${allowedInSeconds}`}>{allowedInSeconds}</span>s
      </Button>
    )
  }

  // Submit vote (not voted yet)
  if (!hasVoted) {
    return (
      <Button data-vote-button key="vote" style="normal" icon="skip" onClick={submitVote}>
        <span key="v1">Vote Skip</span> &bull;{' '}
        <span key={streamInfo.voteSkip.currentCount}>{streamInfo.voteSkip.currentCount}</span>/
        <span key={streamInfo.voteSkip.requiredCount}>{streamInfo.voteSkip.requiredCount}</span>
      </Button>
    )
  }

  // Remove vote (already voted)
  return (
    <Button data-vote-button key="vote" style="normal-highlight" icon="skip" onClick={submitVote}>
      <span key="v2">Voted</span> &bull;{' '}
      <span key={`c${streamInfo.voteSkip.currentCount}`}>{streamInfo.voteSkip.currentCount}</span>/
      <span key={streamInfo.voteSkip.requiredCount}>{streamInfo.voteSkip.requiredCount}</span>
    </Button>
  )
}
