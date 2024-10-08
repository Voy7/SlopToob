'use client'

import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import { StreamState } from '@/shared/enums'
import { twMerge } from 'tailwind-merge'

// Video center overlay items (not bottom controls)
export default function VideoOverlay() {
  const { streamInfo } = useStreamContext()

  return (
    <>
      {streamInfo.streamThemes.includes('FoxNews') && <FoxNewsOverlay />}
      {streamInfo.streamThemes.includes('SaulGoodman') && <SaulGoodmanOverlay />}
      <StateOverlay />
      <BumperOverlay />
      <ActionPopupOverlay />
    </>
  )
}

function StateOverlay() {
  const { streamInfo } = useStreamContext()
  const { isPaused, videoElement } = useVideoContext()

  if (streamInfo.state === StreamState.Playing && isPaused) {
    return (
      <button
        className="absolute left-1/2 top-1/2 m-auto flex -translate-x-1/2 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-xl border-none bg-bg2 px-4 py-1 text-[5rem] text-pink-300 shadow-xl transition-colors duration-150 hover:bg-bg3 hover:text-text1 active:bg-bg4 active:duration-0"
        onClick={() => videoElement.play().catch(() => {})}>
        <Icon name="play" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return (
      <p className="animate-fade-in absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-black bg-opacity-50 p-4 text-xl tracking-wide text-text2">
        <Icon name="pause" />
        STREAM PAUSED
      </p>
    )
  }

  if (streamInfo.state === StreamState.Loading) {
    return (
      <p className="animate-fade-in absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-black bg-opacity-50 p-4 text-xl tracking-wide text-text2">
        <Icon name="loading" />
        LOADING...
      </p>
    )
  }

  if (streamInfo.state === StreamState.Seeking) {
    return (
      <p className="animate-fade-in absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-black bg-opacity-50 p-4 text-xl tracking-wide text-text2">
        <Icon name="loading" />
        SEEKING...
      </p>
    )
  }

  if (streamInfo.state === StreamState.Buffering) {
    return (
      <p className="animate-fade-in absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-black bg-opacity-50 p-4 text-xl tracking-wide text-text2">
        <Icon name="loading" />
        SERVER BUFFERING...
      </p>
    )
  }

  if (streamInfo.state === StreamState.Error) {
    return (
      <div className="animate-video-error absolute left-0 top-0 flex h-full w-full cursor-default flex-col items-center justify-center gap-4 bg-black">
        <Image
          src="/logo-alt.png"
          alt=""
          width={100 * 1.98}
          height={100}
          className="pointer-events-none grayscale filter"
        />
        <p className="rounded-lg border border-red-500 border-opacity-25 bg-bg2 p-2 text-lg text-text2">
          {streamInfo.error}.
        </p>
      </div>
    )
  }

  return null
}

function BumperOverlay() {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()
  const { showControls } = useVideoContext()

  const { currentSeconds, totalSeconds } = useStreamTimestamp(streamInfo, lastStreamUpdateTimestamp)

  // Only show if stream video is a bumper
  if (!('isBumper' in streamInfo) || !streamInfo.isBumper) return null

  // Adding 0.5 helps remove the lingering "0s"
  const remainingTime = Math.floor(totalSeconds - currentSeconds + 0.5)

  let time: number
  let unit: string
  if (remainingTime >= 60) {
    time = Math.floor(remainingTime / 60)
    unit = 'm'
  } else if (remainingTime > 5) {
    // Rounded up
    time = Math.ceil(remainingTime / 5) * 5
    unit = 's'
  } else {
    time = remainingTime
    unit = 's'
  }

  return (
    <div
      className={twMerge(
        'absolute bottom-4 right-4 cursor-default whitespace-nowrap rounded border border-white border-opacity-50 bg-black bg-opacity-75 p-4 text-lg text-white transition-all duration-150',
        showControls && 'bottom-[6rem]'
      )}>
      Ends in{' '}
      <span key={time} className="animate-fade-in">
        {time}
      </span>
      <span key={unit} className="animate-fade-in">
        {unit}
      </span>
    </div>
  )
}

function ActionPopupOverlay() {
  const { actionPopup } = useVideoContext()

  if (!actionPopup) return null

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform cursor-default flex-col items-center justify-center gap-6"
      key={actionPopup.id}>
      <Icon
        name={actionPopup.icon}
        className="animate-video-action-out rounded-full bg-black bg-opacity-50 p-4 text-[5rem] text-[var(--text-color-2)]"
      />
      {actionPopup.text && (
        <p className="animate-fade-out delay-750 text-2xl text-white shadow-md">
          {actionPopup.text}
        </p>
      )}
    </div>
  )
}

function FoxNewsOverlay() {
  return (
    <img
      src="/theme-assets/fox-news-overlay.png"
      alt=""
      className="absolute left-0 top-0 h-full w-full"
    />
  )
}

function SaulGoodmanOverlay() {
  return (
    <img
      src="/theme-assets/saul-goodman-overlay.gif"
      alt=""
      className="absolute left-0 top-0 h-full w-full opacity-50"
    />
  )
}
