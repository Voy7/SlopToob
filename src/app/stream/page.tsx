import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { StreamProvider } from '@/contexts/StreamContext'
import { AuthRole } from '@/lib/enums'
import dynamic from 'next/dynamic'
import { AdminProvider } from '@/contexts/AdminContext'
import Header from '@/components/stream/Header'
import Video from '@/components/stream/Video'
import Chat from '@/components/stream/Chat'
import styles from './Stream.module.scss'

const UsernameModal = dynamic(() => import('@/components/stream/UsernameModal'), { ssr: false })
const AdminModal = dynamic(() => import('@/components/admin/AdminModal'), { ssr: true })

export default async function StreamPage() {
  const session = await getServerSession(authOptions)
  const authUser = session?.user
  if (!authUser) return null

  const cookieStore = cookies()
  const username = cookieStore.get('username')?.value
  const cookieUsername = username || 'Anonymous'

  return (
    <StreamProvider authUser={authUser} cookieUsername={cookieUsername}>
      <UsernameModal />
      {authUser.role >= AuthRole.Admin && (
        <AdminProvider>
          <AdminModal />
        </AdminProvider>
      )}
      <Header />
      <div className={styles.center}>
        <Video />
        <Chat />
      </div>
    </StreamProvider>
  )
}