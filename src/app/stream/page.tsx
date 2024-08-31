import dynamic from 'next/dynamic'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { SocketProvider } from '@/contexts/SocketContext'
import { StreamProvider } from '@/contexts/StreamContext'
import { AdminProvider } from '@/contexts/AdminContext'
import { AuthRole } from '@/lib/enums'
import AuthExpired from '@/components/stream/AuthExpired'
import Header from '@/components/stream/Header'
import Video from '@/components/stream/video/Video'
import Chat from '@/components/stream/Chat'
import InfoBody from '@/components/stream/InfoBody'
import ScheduleDisplay from '@/components/stream/ScheduleDisplay'
import History from '@/components/stream/History'

const AdminModal = dynamic(() => import('@/components/admin/AdminModal'), { ssr: true })

export default async function StreamPage() {
  const session = await getServerSession(authOptions)
  const authUser = session?.user
  if (!authUser) return <AuthExpired />

  const cookieStore = cookies()
  const username = cookieStore.get('nickname')?.value
  const cookieUsername = username || 'Anonymous'

  return (
    <SocketProvider authUser={authUser} cookieUsername={cookieUsername}>
      <StreamProvider>
        <AdminProviderConditional authRole={authUser.role}>
          <Header />
          <div className="flex flex-col md:h-[calc((100vw-var(--chat-width))*9/16)] md:max-h-[calc(100vh-var(--info-body-height)-2px)] md:flex-row">
            <Video />
            <Chat />
          </div>
          <InfoBody />
          <ScheduleDisplay />
          <History />
        </AdminProviderConditional>
      </StreamProvider>
    </SocketProvider>
  )
}

type AdminConditionalProps = {
  authRole: AuthRole
  children: React.ReactNode
}

function AdminProviderConditional({ authRole, children }: AdminConditionalProps) {
  if (authRole < AuthRole.Admin) return children

  return (
    <AdminProvider>
      <AdminModal />
      {children}
    </AdminProvider>
  )
}
