'use client'

import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './VideoOverlay.module.scss'

// Video center overlay items (not bottom controls)
export default function VideoOverlay() {
  const { streamInfo } = useStreamContext()
  const { isPaused, videoElement } = useVideoContext()

  if (streamInfo.state === StreamState.Playing && isPaused) {
    return (
      <button className={styles.playButton} onClick={() => videoElement.play()}>
        <Icon name="play" />
      </button>
    )
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