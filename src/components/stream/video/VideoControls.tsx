'use client'

import { useEffect, useRef } from 'react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import Icon from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'
import RangeSliderInput from '@/components/ui/RangeSliderInput'
import { twMerge } from 'tailwind-merge'

const OVERLAY_MOUSE_TIMEOUT = 3000

type Props = {
  scrubber: JSX.Element
  adminControls?: JSX.Element
}

// Video bottom controls
export default function VideoControls({ scrubber, adminControls }: Props) {
  const {
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

    containerElement.onmousemove = () => {
      hoveredContainer = true
      check()
    }
    containerElement.onmouseleave = () => {
      hoveredContainer = false
      check()
    }
    containerElement.onmousedown = () => {
      hoveredContainer = true
      check()
    }
    containerElement.onmouseup = () => {
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

    check()

    return () => {
      containerElement.onmousemove = null
      containerElement.onmouseleave = null
      containerElement.onmousedown = null
      containerElement.onmouseup = null
      controlsElement.onmousemove = null
      controlsElement.onmouseleave = null
      clearTimeout(timeout)
    }
  }, [containerElement])

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
            <div>
              <ActionButton onClick={() => (videoElement.muted = !videoElement.muted)}>
                <HoverTooltip placement="top" offset={22}>
                  Toggle Volume (m)
                </HoverTooltip>
                <Icon name={volume === 0 ? 'no-volume' : 'volume'} />
              </ActionButton>
            </div>
            <div>
              <HoverTooltip placement="top" offset={22}>
                Volume - {Math.round(volume)}%
              </HoverTooltip>
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
        {adminControls}
        <div>
          <ActionButton onClick={toggleFullscreen}>
            <HoverTooltip placement="top-end" offset={22}>
              Toggle Fullscreen (f)
            </HoverTooltip>
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

  if (streamInfo.state === StreamState.Playing) {
    if (isPaused) {
      return (
        <ActionButton onClick={() => videoElement.play()}>
          <HoverTooltip placement="top-start" offset={22}>
            Unpause (k)
          </HoverTooltip>
          <Icon name="play" />
        </ActionButton>
      )
    }

    return (
      <ActionButton onClick={() => videoElement.pause()}>
        <HoverTooltip placement="top-start" offset={22}>
          Pause - Only for you (k)
        </HoverTooltip>
        <Icon name="pause" />
      </ActionButton>
    )
  }

  return (
    <ActionButton className="cursor-not-allowed text-error hover:text-error">
      <HoverTooltip placement="top-start" offset={22}>
        Stream Paused - Wait for Admin
      </HoverTooltip>
      <Icon name="pause" />
    </ActionButton>
  )
}
