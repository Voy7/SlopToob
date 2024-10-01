'use client'

import Hls from 'hls.js'
import { useContext, createContext, useState, useRef, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import { twMerge } from 'tailwind-merge'
import type { IconNames } from '@/components/ui/Icon'

// Video player context
type ContextProps = {
  isPaused: boolean
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>
  volume: number
  setVolume: React.Dispatch<React.SetStateAction<number>>
  showControls: boolean
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>
  actionPopup: { id: number; icon: IconNames; text?: string } | null
  showActionPopup: (icon: IconNames, text?: string) => void
  toggleFullscreen: () => void
  videoElement: HTMLVideoElement
  containerElement: HTMLDivElement
}

// Context provider wrapper component
export function VideoProvider({ children }: { children: React.ReactNode }) {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(100)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [prevState, setPrevState] = useState<StreamState>(StreamState.Loading)
  const [actionPopup, setActionPopup] = useState<{
    id: number
    icon: IconNames
    text?: string
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [hls, setHls] = useState<Hls>(new Hls())
  const [sourceURL, setSourceURL] = useState<string>('')

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current!
    if (!Hls.isSupported()) {
      alert('HLS is not supported.')
      return
    }
    hls.attachMedia(video)
  }, [])

  // Handle stream state/url changes
  useEffect(() => {
    if (streamInfo.state !== StreamState.Playing && streamInfo.state !== StreamState.Paused) return

    // If hls's current source is the same as the new source, don't reload (avoids flickering)
    if (sourceURL === streamInfo.path) return

    setSourceURL(streamInfo.path)
    hls.loadSource(streamInfo.path)

    // If volume cookie exists, set the volume
    if (!('id' in streamInfo)) return
    const volumeCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`volume-${streamInfo.id}=`))
    if (!volumeCookie) return
    if (!videoRef.current) return
    const volume = Number(volumeCookie.split('=')[1])
    videoRef.current.volume = volume / 100
    setVolume(volume)
  }, [streamInfo, sourceURL])

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current!

    // Sync isPaused state with video
    video.onplay = (event) => {
      if (streamInfo.state !== StreamState.Playing) {
        event.preventDefault()
        video.pause()
        syncVideoTime()
        return
      }
      setIsPaused(false)
      syncVideoTime()
    }

    video.onpause = () => {
      // If the video has reached the end, don't set isPaused to prevent the play button flashing at the end
      if (video.currentTime >= video.duration) return
      setIsPaused(true)
    }

    video.onvolumechange = () => {
      if (video.muted) {
        setVolume(0)
        if (video.volume === 0) video.volume = 1
      } else setVolume(video.volume * 100)
    }

    video.onseeking = (event) => {
      // console.log('seeking', event)
    }

    // There are a bunch of ways to force the player to seek, including the safari video player
    // So enforce the time to be the same as the stream time
    // This might have some weird jumping effects if seeking process takes more than 1 second
    video.onseeked = (event) => {
      syncVideoTime()
    }
  }, [streamInfo, lastStreamUpdateTimestamp])

  // Play/pause video based on stream state
  // And sync video time with stream time
  useEffect(() => {
    const video = videoRef.current!

    if (streamInfo.state !== prevState) {
      setPrevState(streamInfo.state)

      if (streamInfo.state === StreamState.Playing) {
        video.play().catch(() => {})
        return
      }
      video.pause()
    }

    syncVideoTime()
  }, [streamInfo, prevState, lastStreamUpdateTimestamp])

  // Sync video time with stream time if possible
  function syncVideoTime() {
    if (!videoRef.current) return
    if (videoRef.current.seeking) return
    if (!('trueCurrentSeconds' in streamInfo) || !lastStreamUpdateTimestamp) {
      videoRef.current.currentTime = 0
      return
    }
    if (streamInfo.state !== StreamState.Playing) {
      videoRef.current.currentTime = streamInfo.trueCurrentSeconds
      return
    }
    const time = (Date.now() - lastStreamUpdateTimestamp) / 1000 + streamInfo.trueCurrentSeconds
    const diff = Math.abs(videoRef.current.currentTime - time)
    if (diff > 1) videoRef.current.currentTime = time
  }

  // Sync video title with document title
  useEffect(() => {
    if (streamInfo.state === StreamState.Playing || streamInfo.state === StreamState.Paused) {
      document.title = streamInfo.name
      return
    }
    document.title = 'SlopToob'
  }, [streamInfo])

  // Logic for storing volume in cookies for each video
  useEffect(() => {
    if (volume == 100 || !videoRef.current) return
    if (!('id' in streamInfo)) return
    document.cookie = `volume-${streamInfo.id}=${volume}; max-age=86400; path=/` // 1 day
  }, [streamInfo, volume])

  // Pause/unpause video when background is clicked
  function backgroundClick() {
    if (isPaused) videoRef.current?.play().catch(() => {})
    else videoRef.current?.pause()
  }

  let hideCursor: boolean = true
  if (isPaused) hideCursor = false
  if (showControls) hideCursor = false

  function showActionPopup(icon: IconNames, text?: string) {
    setActionPopup({ id: Date.now(), icon, text })
  }

  function toggleFullscreen() {
    if (!videoRef.current || !containerRef.current) return
    // Standard browser fullscreen API
    if ('requestFullscreen' in containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen()
      else containerRef.current.requestFullscreen()
    }
    // Webkit (Safari) fullscreen API
    else if ('webkitEnterFullscreen' in videoRef.current) {
      // @ts-ignore - webkitEnterFullscreen is a non-standard method
      if (videoRef.current.webkitDisplayingFullscreen) videoRef.current.webkitExitFullscreen()
      // @ts-ignore - webkitEnterFullscreen is a non-standard method
      else videoRef.current.webkitEnterFullscreen()
    }
    videoRef.current.focus()
  }

  const context: ContextProps = {
    isPaused,
    setIsPaused,
    volume,
    setVolume,
    showControls,
    setShowControls,
    actionPopup,
    showActionPopup,
    toggleFullscreen,
    videoElement: videoRef.current!,
    containerElement: containerRef.current!
  }

  return (
    <VideoContext.Provider value={context}>
      <div
        ref={containerRef}
        className={twMerge(
          'relative z-[1] flex h-mobile-video-height w-full items-center justify-center overflow-hidden bg-black md:h-full md:w-desktop-video-width',
          hideCursor && 'cursor-none',
          streamInfo.streamThemes.includes('Zoomer') &&
            'grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr]'
        )}
        onClick={backgroundClick}>
        <video
          ref={videoRef}
          className="h-full w-full"
          autoPlay
          playsInline
          controls={false}
          controlsList="nodownload">
          Your browser does not support the video tag.
        </video>
        {streamInfo.streamThemes.includes('Zoomer') && (
          <>
            <video
              src="/theme-assets/zoomer-1.mp4"
              className="h-full w-full"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
            <video
              src="/theme-assets/zoomer-2.mp4"
              className="h-full w-full"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
            <video
              src="/theme-assets/zoomer-3.mp4"
              className="h-full w-full"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
          </>
        )}
        <div className="absolute z-[2] h-full w-full">{children}</div>
      </div>
    </VideoContext.Provider>
  )
}

// Create the context and custom hook for it
export const VideoContext = createContext<ContextProps>(null as any)
export const useVideoContext = () => useContext(VideoContext)
