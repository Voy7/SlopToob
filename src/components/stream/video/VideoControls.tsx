'use client'

import { useEffect, useRef, useState } from 'react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import parseTimestamp from '@/lib/parseTimestamp'
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
  const altControlsContainerRef = useRef<HTMLDivElement>(null)

  const [altTimestamps, setAltTimestamps] = useState<boolean>(
    document.cookie.includes('alt-timestamps')
  )

  const { currentTimestamp, totalTimestamp, currentSeconds, totalSeconds } = useStreamTimestamp(
    streamInfo,
    lastStreamUpdateTimestamp
  )

  function toggleAltTimestamps() {
    document.cookie = altTimestamps
      ? 'alt-timestamps=; max-age=0; path=/'
      : 'alt-timestamps=true; max-age=31536000; path=/' // 1 year
    setAltTimestamps(!altTimestamps)
  }

  // Show overlay when mouse is moved on it, keep it visible for 3 seconds
  // when mouse is moved out or stops moving, hide it after 3 seconds
  useEffect(() => {
    const controlsElement = controlsContainerRef.current
    const altControlsElement = altControlsContainerRef.current

    if (!controlsElement || !altControlsElement || !containerElement) return

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

    controlsElement.onmousemove = () => {
      hoveredControls = true
      check()
    }
    controlsElement.onmouseleave = () => {
      hoveredControls = false
      check()
    }
    controlsElement.ontouchstart = () => {
      hoveredControls = true
      check()
    }

    altControlsElement.onmousemove = () => {
      hoveredControls = true
      check()
    }
    altControlsElement.onmouseleave = () => {
      hoveredControls = false
      check()
    }
    altControlsElement.ontouchstart = () => {
      hoveredControls = true
      check()
    }

    check()

    return () => {
      containerElement.onmousemove = null
      containerElement.onmouseleave = null
      containerElement.onmousedown = null

      controlsElement.onmousemove = null
      controlsElement.onmouseleave = null
      controlsElement.ontouchstart = null

      altControlsElement.onmousemove = null
      altControlsElement.onmouseleave = null
      altControlsElement.ontouchstart = null

      clearTimeout(timeout)
    }
  }, [containerElement])

  return (
    <>
      <div
        ref={altControlsContainerRef}
        className={twMerge(
          'absolute left-0 top-0 flex w-full items-center justify-center overflow-x-auto overflow-y-hidden p-2 duration-150 md:hidden',
          !showControls && '-translate-y-full opacity-0'
        )}
        onClick={(event) => event.stopPropagation()}>
        {adminControls}
      </div>
      <div
        ref={controlsContainerRef}
        className={twMerge(
          'absolute bottom-0 left-0 flex w-full flex-col bg-[rgba(0,0,0,0.5)] shadow-[0_0.5rem_1rem_rgba(0,0,0,0.5)] duration-150',
          !showControls && 'translate-y-full opacity-0'
        )}
        onClick={(event) => event.stopPropagation()}>
        {scrubber}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <PausePlayButton />
            <button
              key={altTimestamps.toString()}
              className="animate-fade-in whitespace-nowrap text-lg text-slate-200 hover:text-white"
              onClick={toggleAltTimestamps}>
              <HoverTooltip placement="top" offset={22}>
                Timestamp Mode: {altTimestamps ? 'Remaining' : 'Elapsed'}
              </HoverTooltip>
              {altTimestamps ? (
                <>
                  -{parseTimestamp(totalSeconds - currentSeconds)} / {totalTimestamp}
                </>
              ) : (
                <>
                  {currentTimestamp} / {totalTimestamp}
                </>
              )}
            </button>
            <div className="group flex items-center pr-8">
              <div>
                <ActionButton onClick={() => (videoElement.muted = !videoElement.muted)}>
                  <HoverTooltip placement="top" offset={22}>
                    Toggle Volume (m)
                  </HoverTooltip>
                  <Icon
                    name={volume === 0 ? 'no-volume' : 'volume'}
                    className={videoElement?.muted ? 'text-red-500' : undefined}
                  />
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
          <div className="hidden md:block">{adminControls}</div>
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
    </>
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
