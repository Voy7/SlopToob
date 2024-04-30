'use client'

import Hls from 'hls.js'
import { useContext, createContext, useState, useRef, useEffect } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { StreamState } from '@/lib/enums'
import styles from '@/components/stream/Video.module.scss'

// Video player context
type ContextProps = {
  isPaused: boolean, setIsPaused: React.Dispatch<React.SetStateAction<boolean>>,
  volume: number, setVolume: React.Dispatch<React.SetStateAction<number>>,
  showControls: boolean, setShowControls: React.Dispatch<React.SetStateAction<boolean>>,
  videoElement: HTMLVideoElement,
  containerElement: HTMLDivElement
}

// Context provider wrapper component
export function VideoProvider({ children }: { children: React.ReactNode }) {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(100)
  const [showControls, setShowControls] = useState<boolean>(false)

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
  }, [streamInfo, sourceURL])

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current!
    
    // Sync isPaused state with video
    video.onplay = (event) => {
      if (streamInfo.state !== StreamState.Playing) {
        event.preventDefault()
        video.pause()
        return
      }
      setIsPaused(false)

      // Seek to current time
      if (!lastStreamUpdateTimestamp) return
      const diff = ((Date.now() - lastStreamUpdateTimestamp) / 1000) + streamInfo.currentSeconds
      video.currentTime = diff
    }

    video.onpause = () => { setIsPaused(true) }

    video.onvolumechange = () => {
      if (video.muted) {
        setVolume(0)
        if (video.volume === 0) video.volume = 1
      }
      else setVolume(video.volume * 100)
    }
  }, [streamInfo, lastStreamUpdateTimestamp])

  // Play/pause video based on stream state
  useEffect(() => {
    const video = videoRef.current!

    if (streamInfo.state === StreamState.Playing) {
      video.play().catch(() => {})
      return
    }
    video.pause()
  }, [streamInfo, lastStreamUpdateTimestamp])

  // Pause/unpause video when background is clicked
  function backgroundClick() {
    if (isPaused) videoRef.current?.play()
    else videoRef.current?.pause()
  }

  let hideCursor: boolean = true
  if (isPaused) hideCursor = false
  if (showControls) hideCursor = false

  const context: ContextProps = {
    isPaused, setIsPaused,
    volume, setVolume,
    showControls, setShowControls,
    videoElement: videoRef.current!,
    containerElement: containerRef.current!
  }

  return (
    <VideoContext.Provider value={context}>
      <div ref={containerRef} className={hideCursor ? `${styles.videoContainer} ${styles.hideCursor}` : styles.videoContainer} onClick={backgroundClick}>
        <video ref={videoRef} autoPlay>
          Your browser does not support the video tag.
        </video>
        {children}
      </div>
    </VideoContext.Provider>
  )
}

// Create the context and custom hook for it
export const VideoContext = createContext<ContextProps>(null as any)
export const useVideoContext = () => useContext(VideoContext)