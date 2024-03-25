'use client'

import Hls from 'hls.js'
import { useEffect, useRef } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { PlayerState } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './Video.module.scss'

export default function Video() {
  const { streamInfo } = useStreamContext()

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (streamInfo.state !== PlayerState.Playing) return

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
          video.play()
        }
        catch (e) {}
    })
  }, [streamInfo])

  // Video is playing
  if (streamInfo.state === PlayerState.Playing) {
    return (
      <div className={styles.videoContainer}>
        <video ref={videoRef} autoPlay controls>
          Your browser does not support the video tag.
        </video>
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