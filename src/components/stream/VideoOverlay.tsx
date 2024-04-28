'use client'

import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import Icon from '@/components/ui/Icon'
import { StreamState } from '@/lib/enums'
import styles from './VideoOverlay.module.scss'
import { useState } from 'react'

// Video center overlay items (not bottom controls)
export default function VideoOverlay() {
  return (
    <>
      <StateOverlay />
      <BumperOverlay />
    </>
  )
}

function StateOverlay() {
  const { streamInfo } = useStreamContext()
  const { isPaused, videoElement } = useVideoContext()

  if (streamInfo.state === StreamState.Playing && isPaused) {
    return (
      <button className={styles.playButton} onClick={() => videoElement.play()}>
        <Icon name="play" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return <p className={styles.paused}><Icon name="pause" />STREAM PAUSED</p>
  }

  if (streamInfo.state === StreamState.Loading) {
    return <p className={styles.loading}><Icon name="loading" />LOADING...</p>
  }

  if (streamInfo.state === StreamState.Error) {
    return (
      <div className={styles.error}>
        <Icon name="warning" />
        <p>{streamInfo.error}.</p>
      </div>
    )
  }

  return null
}

function BumperOverlay() {
  const { streamInfo } = useStreamContext()

  const { currentSeconds, totalSeconds } = useStreamTimestamp()

  // Only show if stream video is a bumper
  if (!('isBumper' in streamInfo) || !streamInfo.isBumper) return null

  // Adding 0.5 helps remove the lingering "0s"
  const remainingTime = Math.floor(totalSeconds - currentSeconds + 0.5)

  // If time is >= 1 minute, time is in minutes (rounded down)
  // If time is < 1 minute, time is in 5 second increments
  // If time is < 5 seconds, time is in seconds
  let time: number
  let unit: string
  if (remainingTime >= 60) {
    time = Math.floor(remainingTime / 60)
    unit = 'm'
  }
  else if (remainingTime > 5) { // Rounded up
    time = Math.ceil(remainingTime / 5) * 5
    unit = 's'
  }
  else {
    time = remainingTime
    unit = 's'
  }

  return (
    <div className={styles.bumperTime}>
      Ends in <span key={time}>{time}</span><span key={unit}>{unit}</span>
    </div>
  )
}