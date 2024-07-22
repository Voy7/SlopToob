import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { SocketProvider } from '@/contexts/SocketContext'
import { StreamProvider } from '@/contexts/StreamContext'
import { AuthRole } from '@/lib/enums'
import dynamic from 'next/dynamic'
import { AdminProvider } from '@/contexts/AdminContext'
import AuthExpired from '@/components/stream/AuthExpired'
import AdminPanel from '@/components/admin/AdminPanel'

// const AdminModal = dynamic(() => import('@/components/admin/AdminModal'), { ssr: true })

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const authUser = session?.user
  if (!authUser) return <AuthExpired />
  if (authUser.role < AuthRole.Admin) return <h1>No permission</h1>

  const cookieStore = cookies()
  const username = cookieStore.get('nickname')?.value
  const cookieUsername = username || 'Anonymous'

  return (
    <SocketProvider authUser={authUser} cookieUsername={cookieUsername}>
      <AdminProvider>
        <AdminPanel />
      </AdminProvider>
    </SocketProvider>
  )
}
