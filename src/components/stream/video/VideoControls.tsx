'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState, AuthRole } from '@/lib/enums'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import useTooltip from '@/hooks/useTooltip'
import Icon from '@/components/ui/Icon'
import Tooltip from '@/components/ui/Tooltip'
import { twMerge } from 'tailwind-merge'
import RangeSliderInput from '../../ui/RangeSliderInput'

const OVERLAY_MOUSE_TIMEOUT = 3000

// Video bottom controls
export default function VideoControls({ scrubber }: { scrubber: JSX.Element }) {
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

  const controlsContainerRef = useRef<HTMLDivElement>(null)

  const { currentTimestamp, totalTimestamp } = useStreamTimestamp(
    streamInfo,
    lastStreamUpdateTimestamp
  )

  const volumeBtnTooltip = useTooltip('top', 25)
  const volumeSliderTooltip = useTooltip('top', 25)
  const fullscreenTooltip = useTooltip('top-end', 25)

  // Show overlay when mouse is moved on it, keep it visible for 3 seconds
  // when mouse is moved out or stops moving, hide it after 3 seconds
  useEffect(() => {
    const controlsElement = controlsContainerRef.current

    if (!controlsElement || !containerElement) return

    let timeout: NodeJS.Timeout
    let hoveredControls = false
    let hoveredContainer = false

    function check() {
      if (hoveredControls) {
        clearTimeout(timeout)
        setShowControls(true)
        return
      }
      if (hoveredContainer) {
        startTimer()
        return
      }
      clearTimeout(timeout)
      setShowControls(false)
    }

    function startTimer() {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), OVERLAY_MOUSE_TIMEOUT)
    }

    if (!isPaused) startTimer()

    containerElement.onmousemove = () => {
      hoveredContainer = true
      check()
    }
    containerElement.onmouseleave = () => {
      hoveredContainer = false
      check()
    }

    controlsElement.onmousemove = () => {
      hoveredControls = true
      check()
    }
    controlsElement.onmouseleave = () => {
      hoveredControls = false
      check()
    }

    return () => {
      containerElement.onmousemove = null
      containerElement.onmouseleave = null
      controlsElement.onmousemove = null
      controlsElement.onmouseleave = null
      clearTimeout(timeout)
    }
  }, [isPaused, containerElement])

  return (
    <div
      ref={controlsContainerRef}
      className={twMerge(
        'absolute bottom-0 left-0 flex w-full flex-col bg-[rgba(0,0,0,0.5)] shadow-[0_0.5rem_1rem_rgba(0,0,0,0.5)] transition-[150ms]',
        !showControls && 'translate-y-full opacity-0'
      )}
      onClick={(event) => event.stopPropagation()}>
      {scrubber}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <PausePlayButton />
          <p className="cursor-default text-lg text-slate-200">
            {currentTimestamp} / {totalTimestamp}
          </p>
          <div className="group flex items-center pr-8">
            <div {...volumeBtnTooltip.anchorProps}>
              <Tooltip {...volumeBtnTooltip.tooltipProps}>Toggle Volume (m)</Tooltip>
              <ActionButton onClick={() => (videoElement.muted = !videoElement.muted)}>
                <Icon name={volume === 0 ? 'no-volume' : 'volume'} />
              </ActionButton>
            </div>
            <div {...volumeSliderTooltip.anchorProps}>
              <Tooltip {...volumeSliderTooltip.tooltipProps}>
                Volume - {Math.round(volume)}%
              </Tooltip>
              <RangeSliderInput
                value={volume}
                onChange={(value) => {
                  videoElement.volume = value / 100
                  videoElement.muted = false
                }}
                className="h-[3.5rem] w-0 opacity-0 transition-[150ms] ease-in-out group-hover:w-20 group-hover:opacity-100"
              />
            </div>
          </div>
        </div>
        {authUser && authUser.role >= AuthRole.Admin && (
          <div className="flex items-center gap-2">
            {/* <button className={styles.actionButton} onClick={() => setShowKeybindsModal(true)}>
              <Icon name="stream-settings" />
            </button> */}
          </div>
        )}
        <div {...fullscreenTooltip.anchorProps}>
          <Tooltip {...fullscreenTooltip.tooltipProps}>Toggle Fullscreen (f)</Tooltip>
          <ActionButton onClick={toggleFullscreen}>
            <Icon name="fullscreen" />
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={twMerge('border-[none] p-2 text-4xl text-slate-200 hover:text-white', className)}
    />
  )
}

function PausePlayButton() {
  const { isPaused, videoElement } = useVideoContext()
  const { streamInfo } = useStreamContext()

  const tooltip = useTooltip('top-start', 25)

  if (streamInfo.state === StreamState.Playing) {
    if (isPaused) {
      return (
        <div {...tooltip.anchorProps}>
          <Tooltip {...tooltip.tooltipProps}>Unpause (k)</Tooltip>
          <ActionButton onClick={() => videoElement.play()}>
            <Icon name="play" />
          </ActionButton>
        </div>
      )
    }

    return (
      <div {...tooltip.anchorProps}>
        <Tooltip {...tooltip.tooltipProps}>Pause - Only for you (k)</Tooltip>
        <ActionButton onClick={() => videoElement.pause()}>
          <Icon name="pause" />
        </ActionButton>
      </div>
    )
  }

  return (
    <div {...tooltip.anchorProps}>
      <Tooltip {...tooltip.tooltipProps}>Stream Paused - Wait for Admin</Tooltip>
      <ActionButton className="cursor-not-allowed text-error hover:text-error">
        <Icon name="pause" />
      </ActionButton>
    </div>
  )
}
