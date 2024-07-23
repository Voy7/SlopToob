'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState, AuthRole } from '@/lib/enums'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import useTooltip from '@/hooks/useTooltip'
import Icon from '@/components/ui/Icon'
import Tooltip from '@/components/ui/Tooltip'
import styles from './VideoControls.module.scss'

const OVERLAY_MOUSE_TIMEOUT = 3000
const VOLUME_STEP_PERCENT = 0.05

// Video bottom controls
export default function VideoControls() {
  const session = useSession()
  const authUser = session.data?.user

  const {
    isPaused,
    volume,
    showControls,
    setShowControls,
    videoElement,
    containerElement,
    showActionPopup,
    toggleFullscreen
  } = useVideoContext()
  const {
    streamInfo,
    lastStreamUpdateTimestamp,
    setShowClearChatModal,
    setShowKeybindsModal,
    setShowAdminModal
  } = useStreamContext()

  const { currentTimestamp, totalTimestamp, currentSeconds, totalSeconds } = useStreamTimestamp(
    streamInfo,
    lastStreamUpdateTimestamp
  )

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

  return (
    <div
      className={showControls ? `${styles.controlsBar} ${styles.show}` : styles.controlsBar}
      onClick={(event) => event.stopPropagation()}
    >
      <progress value={currentSeconds} max={totalSeconds || 1}></progress>
      <div className={styles.controls}>
        <div className={styles.group}>
          <PausePlayButton />
          <p>
            {currentTimestamp} / {totalTimestamp}
          </p>
          <button className={`${styles.actionButton} ${styles.volumeButton}`}>
            <Icon
              name={volume === 0 ? 'no-volume' : 'volume'}
              onClick={() => (videoElement.muted = !videoElement.muted)}
            />
            {/* {volume === 0 ? <Icon name="no-volume" /> : <Icon name="volume" />} */}
            <div className={styles.volumeContainer}>
              <input
                type="range"
                value={volume}
                onChange={(event) => (videoElement.volume = parseInt(event.target.value) / 100)}
              />
            </div>
          </button>
        </div>
        {authUser && authUser.role >= AuthRole.Admin && (
          <div className={styles.group}>
            {/* <button className={styles.actionButton} onClick={() => setShowKeybindsModal(true)}>
              <Icon name="stream-settings" />
            </button> */}
          </div>
        )}
        <div className={styles.group}>
          <button className={styles.actionButton} onClick={toggleFullscreen}>
            <Icon name="fullscreen" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PausePlayButton() {
  const { isPaused, videoElement } = useVideoContext()
  const { streamInfo } = useStreamContext()

  if (streamInfo.state === StreamState.Playing) {
    if (isPaused) {
      return (
        <button className={styles.actionButton} onClick={() => videoElement.play()}>
          <Icon name="play" />
        </button>
      )
    }

    return (
      <button className={styles.actionButton} onClick={() => videoElement.pause()}>
        <Icon name="pause" />
      </button>
    )
  }

  return <StreamPausedButton />
}

function StreamPausedButton() {
  const tooltip = useTooltip('top-start')

  return (
    <>
      <button className={`${styles.actionButton} ${styles.disabled}`} {...tooltip.anchorProps}>
        <Icon name="pause" />
      </button>
      <Tooltip {...tooltip.tooltipProps}>Stream Paused</Tooltip>
    </>
  )
}
