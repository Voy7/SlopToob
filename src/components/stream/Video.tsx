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
  const [volume, setVolume] = useState<number>(100)
  const [currentSeconds, setCurrentSeconds] = useState<number>(0)
  const [showControls, setShowControls] = useState<boolean>(false)
  // const [totalSeconds, setTotalSeconds] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)

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
      video.currentTime = streamInfo.currentSeconds
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
    video.onpause = () => {
      setIsPaused(true)
      setShowControls(true)
    }
  }, [streamInfo, lastStreamUpdateTimestamp])

  useEffect(() => {
    if (streamInfo.state !== PlayerState.Paused) {
      return
    }
    const video = videoRef.current!
    video.pause()
  }, [streamInfo])

  const OVERLAY_MOUSE_TIMEOUT = 3000

  // Show overlay when mouse is moved on it, keep it visible for 3 seconds
  // when mouse is moved out or stops moving, hide it after 3 seconds
  useEffect(() => {
    const controls = controlsRef.current!
    let timeout: NodeJS.Timeout

    controls.onmousemove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (!isPaused) setShowControls(false)
      }, OVERLAY_MOUSE_TIMEOUT)
    }

    controls.onmouseleave = () => {
      clearTimeout(timeout)
      if (!isPaused) setShowControls(false)
    }

    return () => {
      controls.onmousemove = null
      controls.onmouseleave = null
      clearTimeout(timeout)
    }
  }, [isPaused])

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

  function toggleFullscreen() {
    const element = controlsRef.current!
    if (document.fullscreenElement) document.exitFullscreen()
    else element.requestFullscreen()
  }

  // Pause/unpause video when background is clicked
  function backgroundClick() {
    if (isPaused) videoRef.current?.play()
    else videoRef.current?.pause()
  }

  return (
    <div ref={controlsRef} className={styles.videoContainer} onClick={backgroundClick}>
      <video ref={videoRef} autoPlay>
        Your browser does not support the video tag.
      </video>
      <div className={showControls ? `${styles.controlsOverlay} ${styles.show}` : styles.controlsOverlay}>
        <div></div>
        <div>
          {isPaused && (
            <button className={styles.playButton} onClick={() => videoRef.current?.play()}>
              <Icon name="play" />
            </button>
          )}
        </div>
        <div className={styles.controlsBar} onClick={event => event.stopPropagation()}>
          <progress value={currentSeconds} max={'totalSeconds' in streamInfo ? streamInfo.totalSeconds : currentSeconds}></progress>
          <div className={styles.controls}>
            <div className={styles.group}>
              {streamInfo.state === PlayerState.Playing && (
                <>
                  {isPaused ? (
                    <button className={styles.actionButton} onClick={() => videoRef.current?.play()}>
                      <Icon name="play" />
                    </button>
                  ): (
                    <button className={styles.actionButton} onClick={() => videoRef.current?.pause()}>
                      <Icon name="pause" />
                    </button>
                  )}
                  <p>{currentSeconds.toFixed(0)} / {streamInfo.totalSeconds.toFixed(0)}</p>
                </>
              )}
              <button className={`${styles.actionButton} ${styles.volumeButton}`}>
                {volume === 0 ? <Icon name="no-volume" /> : <Icon name="volume" />}
                <div className={styles.volumeContainer}>
                  <input type="range" value={volume} onChange={event => videoRef.current!.volume = parseInt(event.target.value) / 100} />
                </div>
              </button>
            </div>
            <div className={styles.group}>
              <button className={styles.actionButton} onClick={toggleFullscreen}>
                <Icon name="fullscreen" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Video is playing
  if (streamInfo.state === PlayerState.Playing) {
    return (
      <div className={styles.videoContainer}>
        {/* {videoElement} */}
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
        {/* {videoElement} */}
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
          {/* {streamInfo.error} */}
        </div>
      </div>
    )
  }
}

function VideoOverlay() {
  return (
    <div className={styles.overlay}>
      <Icon name="play" className={styles.playButton} />
    </div>
  )
}