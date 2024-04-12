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
  currentSeconds: number, setCurrentSeconds: React.Dispatch<React.SetStateAction<number>>,
  showControls: boolean, setShowControls: React.Dispatch<React.SetStateAction<boolean>>,
  videoElement: HTMLVideoElement,
  containerElement: HTMLDivElement
}

type Props =  {
  children: React.ReactNode
}

// Context provider wrapper component
export function VideoProvider({ children }:Props) {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(100)
  const [currentSeconds, setCurrentSeconds] = useState<number>(0)
  const [showControls, setShowControls] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (streamInfo.state !== StreamState.Playing && streamInfo.state !== StreamState.Paused) return

    const video = videoRef.current!

    // called when video is unpaused
    // video.onplay = () => {
    //   streamInfo.
    // }
    
    if (!Hls.isSupported()) {
      alert('HLS is not supported.')
      return
    }

    const hls = new Hls()
    hls.loadSource(streamInfo.path)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.currentTime = streamInfo.currentSeconds
    })

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
      console.log('diff', diff, streamInfo.currentSeconds)
      video.currentTime = diff
    }
    video.onpause = () => {
      setIsPaused(true)
      // setShowControls(true)
    }
  }, [streamInfo, lastStreamUpdateTimestamp])

  useEffect(() => {
    if (streamInfo.state !== StreamState.Paused) {
      return
    }
    const video = videoRef.current!
    video.pause()
  }, [streamInfo])

  

  

  useEffect(() => {
    // Update current time when video time changes
    const video = videoRef.current!

    video.ontimeupdate = () => {
      setCurrentSeconds(video.currentTime)
    }

    video.onvolumechange = () => {
      setVolume(video.volume * 100)
    }
  }, [])

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
    currentSeconds, setCurrentSeconds,
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