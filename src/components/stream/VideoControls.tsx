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
import { twMerge } from 'tailwind-merge'

const OVERLAY_MOUSE_TIMEOUT = 3000

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
    toggleFullscreen
  } = useVideoContext()
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

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
      className={twMerge(
        'absolute bottom-0 left-0 flex w-full flex-col shadow-[0_0.5rem_1rem_rgba(0,0,0,0.5)] transition-[150ms]',
        !showControls && 'translate-y-full opacity-0'
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {/* <progress
        className="webkit h-[5px] w-full appearance-none border-[none] bg-[rgba(136,136,136,0.5)] transition-[150ms]"
        value={currentSeconds}
        max={totalSeconds || 1}
      /> */}
      <div className="h-[0.5rem] w-full bg-[rgba(136,136,136,0.5)]">
        <div
          className="h-full bg-blue-500 transition-[width] duration-150"
          style={{ width: `${(currentSeconds / totalSeconds) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <PausePlayButton />
          <p>
            {currentTimestamp} / {totalTimestamp}
          </p>
          <ActionButton className="group gap-1">
            <Icon
              name={volume === 0 ? 'no-volume' : 'volume'}
              onClick={() => (videoElement.muted = !videoElement.muted)}
            />
            <div className="flex w-0 items-center gap-2 opacity-0 transition-[150ms] ease-in-out group-hover:w-20 group-hover:opacity-100">
              <input
                className="h-full w-full appearance-none border-[none] text-base transition-[150ms] ease-in-out [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-red-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-500"
                type="range"
                value={volume}
                onChange={(event) => (videoElement.volume = parseInt(event.target.value) / 100)}
              />
            </div>
          </ActionButton>
        </div>
        {authUser && authUser.role >= AuthRole.Admin && (
          <div className="flex items-center gap-2">
            {/* <button className={styles.actionButton} onClick={() => setShowKeybindsModal(true)}>
              <Icon name="stream-settings" />
            </button> */}
          </div>
        )}
        <div className="flex items-center gap-2">
          <ActionButton onClick={toggleFullscreen}>
            <Icon name="fullscreen" />
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={twMerge(
        'flex cursor-pointer items-center justify-center border-[none] p-2 text-[2rem] text-[white]',
        props.className
      )}
    />
  )
}

function PausePlayButton() {
  const { isPaused, videoElement } = useVideoContext()
  const { streamInfo } = useStreamContext()

  if (streamInfo.state === StreamState.Playing) {
    if (isPaused) {
      return (
        <ActionButton onClick={() => videoElement.play()}>
          <Icon name="play" />
        </ActionButton>
      )
    }

    return (
      <ActionButton onClick={() => videoElement.pause()}>
        <Icon name="pause" />
      </ActionButton>
    )
  }

  return <StreamPausedButton />
}

function StreamPausedButton() {
  const tooltip = useTooltip('top-start')

  return (
    <>
      <ActionButton className="text-error cursor-not-allowed" {...tooltip.anchorProps}>
        <Icon name="pause" />
      </ActionButton>
      <Tooltip {...tooltip.tooltipProps}>Stream Paused</Tooltip>
    </>
  )
}
