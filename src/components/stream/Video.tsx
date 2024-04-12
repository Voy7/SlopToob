'use client'

import { VideoProvider } from '@/contexts/VideoContext'
import VideoOverlay from '@/components/stream/VideoOverlay'
import VideoControls from '@/components/stream/VideoControls'
import styles from './Video.module.scss'

export default function Video() {
  return (
    <VideoProvider>
      <VideoOverlay />
      <VideoControls />
    </VideoProvider>
  )
}