'use client'

import { useEffect, useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useStreamContext } from '@/contexts/StreamContext'
import useSocketOn from '@/hooks/useSocketOn'
import Button from '@/components/ui/Button'
import { Msg } from '@/lib/enums'

// Vote skip button
export default function VoteSkipButton() {
  const { socket } = useSocketContext()
  const { streamInfo } = useStreamContext()

  const [hasVoted, setHasVoted] = useState<boolean>(false)
  const [allowedInSeconds, setAllowedInSeconds] = useState<number>(-1)

  useEffect(() => {
    if (streamInfo.voteSkip.allowedInSeconds <= -1) {
      console.log(streamInfo.voteSkip)
      setAllowedInSeconds(-1)
      if (!streamInfo.voteSkip.isAllowed) setHasVoted(false)
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
      <Button data-vote-button variant="normal" icon="skip" disabled={false}>
        Vote Skipping Disabled
      </Button>
    )
  }

  // Vote skip not ready yet
  if (!streamInfo.voteSkip.isAllowed && streamInfo.voteSkip.allowedInSeconds <= -1) {
    return (
      <Button data-vote-button variant="normal" icon="skip" disabled={false}>
        Vote Skip &bull; Wait
      </Button>
    )
  }

  // Vote skip countdown to be allowed
  if (!streamInfo.voteSkip.isAllowed) {
    return (
      <Button data-vote-button variant="normal" icon="skip">
        Vote Skip &bull;{' '}
        <span key={`s${allowedInSeconds}`} className="animate-fade-in">
          {allowedInSeconds}
        </span>
        s
      </Button>
    )
  }

  // Submit vote (not voted yet)
  if (!hasVoted) {
    return (
      <Button data-vote-button key="vote" variant="normal" icon="skip" onClick={submitVote}>
        <span key="v1">Vote Skip</span> &bull;{' '}
        <span key={streamInfo.voteSkip.currentCount} className="animate-fade-in">
          {streamInfo.voteSkip.currentCount}
        </span>
        /
        <span key={streamInfo.voteSkip.requiredCount} className="animate-fade-in">
          {streamInfo.voteSkip.requiredCount}
        </span>
      </Button>
    )
  }

  // Remove vote (already voted)
  return (
    <Button
      data-vote-button
      key="voted"
      variant="normal"
      className="border-purple-500 hover:border-purple-500"
      icon="skip"
      onClick={submitVote}>
      <span key="v2" className="animate-fade-in">
        Voted
      </span>{' '}
      &bull;{' '}
      <span key={`c${streamInfo.voteSkip.currentCount}`} className="animate-fade-in">
        {streamInfo.voteSkip.currentCount}
      </span>
      /
      <span key={streamInfo.voteSkip.requiredCount} className="animate-fade-in">
        {streamInfo.voteSkip.requiredCount}
      </span>
    </Button>
  )
}
