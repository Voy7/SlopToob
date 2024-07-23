import { VideoProvider } from '@/contexts/VideoContext'
import VideoOverlay from '@/components/stream/VideoOverlay'
import VideoControls from '@/components/stream/VideoControls'
import StreamKeybinds from '@/components/stream/StreamKeybinds'

export default function Video() {
  return (
    <VideoProvider>
      <VideoOverlay />
      <VideoControls />
      <StreamKeybinds />
    </VideoProvider>
  )
}
