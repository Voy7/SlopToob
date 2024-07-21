import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { SocketProvider } from '@/contexts/SocketContext'
import { StreamProvider } from '@/contexts/StreamContext'
import { AuthRole } from '@/lib/enums'
import dynamic from 'next/dynamic'
import { AdminProvider } from '@/contexts/AdminContext'
import AuthExpired from '@/components/stream/AuthExpired'
import Header from '@/components/stream/Header'
import Video from '@/components/stream/Video'
import Chat from '@/components/stream/Chat'
import InfoBody from '@/components/stream/InfoBody'
import History from '@/components/stream/History'
import KeybindsListModal from '@/components/stream/KeybindsListModal'
import StreamControls from '@/components/admin/StreamControls'
import styles from './Stream.module.scss'

const NicknameModal = dynamic(() => import('@/components/stream/NicknameModal'), { ssr: false })
const AdminModal = dynamic(() => import('@/components/admin/AdminModal'), { ssr: true })

export default async function StreamPage() {
  const session = await getServerSession(authOptions)
  const authUser = session?.user
  if (!authUser) return <AuthExpired />

  const cookieStore = cookies()
  const username = cookieStore.get('nickname')?.value
  const cookieUsername = username || 'Anonymous'

  return (
    <SocketProvider>
      <StreamProvider authUser={authUser} cookieUsername={cookieUsername}>
        <NicknameModal />
        {authUser.role >= AuthRole.Admin && (
          <AdminProvider>
            <AdminModal />
          </AdminProvider>
        )}
        <Header />
        <div className={styles.videoAndChat}>
          <Video />
          <Chat />
        </div>
        <InfoBody />
        <History />
        <KeybindsListModal />
        {/* {authUser.role >= AuthRole.Admin && <StreamControls />} */}
      </StreamProvider>
    </SocketProvider>
  )
}
