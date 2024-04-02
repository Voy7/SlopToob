'use client'

import Hls from 'hls.js'
import { useEffect, useRef, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { PlayerState } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './Video.module.scss'

export default function Video() {
  const { streamInfo, lastStreamUpdateTimestamp } = useStreamContext()

  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [currentSeconds, setCurrentSeconds] = useState<number>(0)
  // const [totalSeconds, setTotalSeconds] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (streamInfo.state !== PlayerState.Playing && streamInfo.state !== PlayerState.Paused) return

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
        // seek to
        video.currentTime = streamInfo.currentSeconds
        try {
          // video.play()
        }
        catch (e) {}
    })

    // Sync isPaused state with video
    video.onplay = (event) => {
      if (streamInfo.state !== PlayerState.Playing) {
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
    video.onpause = () => setIsPaused(true)
  }, [streamInfo, lastStreamUpdateTimestamp])

  useEffect(() => {
    if (streamInfo.state !== PlayerState.Paused) return
    const video = videoRef.current!
    video.pause()
  }, [streamInfo])

  const videoElement = (
    <video ref={videoRef} autoPlay>
      Your browser does not support the video tag.
    </video>
  )

  // Video is playing
  if (streamInfo.state === PlayerState.Playing) {
    return (
      <div className={styles.videoContainer}>
        {videoElement}
        {isPaused && (
          <div className={styles.overlay}>
            <Icon name="play" className={styles.playButton} onClick={() => videoRef.current?.play()} />
          </div>
        )}
      </div>
    )
  }

  // Video is paused (server side)
  if (streamInfo.state === PlayerState.Paused) {
    return (
      <div className={styles.videoContainer}>
        {videoElement}
        <div className={styles.overlay}>
          <Icon name="pause" className={styles.pauseIcon} />
        </div>
      </div>
    )
  }

  // Video is loading
  if (streamInfo.state === PlayerState.Loading) {
    return (
      <div className={styles.videoContainer}>
        <div className={styles.loading}>
          <Icon name="loading" />
          Loading Stream...
        </div>
      </div>
    )
  }

  // Video gave error (typically will change to loading after a few seconds)
  if (streamInfo.state === PlayerState.Error) {
    return (
      <div className={styles.videoContainer}>
        <div className={styles.error}>
          <Icon name="warning" />
          {streamInfo.error}
        </div>
      </div>
    )
  }
}