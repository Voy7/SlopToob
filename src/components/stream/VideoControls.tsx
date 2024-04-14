'use client'

import { useEffect } from 'react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import parseTimestamp from '@/lib/parseTimestamp'
import Icon from '@/components/ui/Icon'
import styles from './VideoControls.module.scss'

const OVERLAY_MOUSE_TIMEOUT = 3000

// Video bottom controls
export default function VideoControls() {
  const { isPaused, currentSeconds, volume, showControls, setShowControls, videoElement, containerElement } = useVideoContext()
  const { streamInfo } = useStreamContext()

  // Show overlay when mouse is moved on it, keep it visible for 3 seconds
  // when mouse is moved out or stops moving, hide it after 3 seconds
  useEffect(() => {
    if (!containerElement) return

    let timeout: NodeJS.Timeout

    function startTimer() {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), OVERLAY_MOUSE_TIMEOUT)
    }

    if (!isPaused) startTimer()

    containerElement.onmousemove = startTimer

    containerElement.onmouseleave = () => {
      clearTimeout(timeout)
      setShowControls(false)
    }

    return () => {
      containerElement.onmousemove = null
      containerElement.onmouseleave = null
      clearTimeout(timeout)
    }
  }, [isPaused, containerElement])

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerElement.requestFullscreen()
  }

  return (
    <div className={showControls ? `${styles.controlsBar} ${styles.show}` : styles.controlsBar} onClick={event => event.stopPropagation()}>
      <progress value={currentSeconds} max={'totalSeconds' in streamInfo ? streamInfo.totalSeconds : currentSeconds}></progress>
      <div className={styles.controls}>
        <div className={styles.group}>
          {streamInfo.state === StreamState.Playing && (
            <>
              {isPaused ? (
                <button className={styles.actionButton} onClick={() => videoElement.play()}>
                  <Icon name="play" />
                </button>
              ): (
                <button className={styles.actionButton} onClick={() => videoElement.pause()}>
                  <Icon name="pause" />
                </button>
              )}
              <p>{parseTimestamp(currentSeconds)} / {parseTimestamp(streamInfo.totalSeconds)}</p>
            </>
          )}
          <button className={`${styles.actionButton} ${styles.volumeButton}`}>
            {volume === 0 ? <Icon name="no-volume" /> : <Icon name="volume" />}
            <div className={styles.volumeContainer}>
              <input type="range" value={volume} onChange={event => videoElement.volume = parseInt(event.target.value) / 100} />
            </div>
          </button>
        </div>
        <div className={styles.group}>
          <button className={styles.actionButton} onClick={toggleFullscreen}>
            <Icon name="fullscreen" />
          </button>
        </div>
      </div>
    </div>
  )
}