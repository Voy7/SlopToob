import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { AuthRole } from '@/lib/enums'
import { VideoProvider } from '@/contexts/VideoContext'
import VideoOverlay from '@/components/stream/video/VideoOverlay'
import VideoControls from '@/components/stream/video/VideoControls'
import StreamKeybinds from '@/components/stream/StreamKeybinds'
import NormalScrubber from '@/components/stream/video/NormalScrubber'
import AdminScrubber from '@/components/stream/video/AdminScrubber'
import AdminControls from '@/components/stream/video/AdminControls'

export default async function Video() {
  const session = await getServerSession(authOptions)
  const authUser = session?.user
  if (!authUser) return null

  return (
    <VideoProvider>
      <VideoOverlay />
      <VideoControls
        scrubber={authUser.role >= AuthRole.Admin ? <AdminScrubber /> : <NormalScrubber />}
        adminControls={authUser.role >= AuthRole.Admin ? <AdminControls /> : undefined}
      />
      <StreamKeybinds />
    </VideoProvider>
  )
}
