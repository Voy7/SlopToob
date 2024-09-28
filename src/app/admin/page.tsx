import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { SocketProvider } from '@/contexts/SocketContext'
import { AuthRole } from '@/lib/enums'
import { AdminProvider } from '@/contexts/AdminContext'
import Icon from '@/components/ui/Icon'
import AuthExpired from '@/components/layout/AuthExpired'
import AdminPanel from '@/components/admin/AdminPanel'
import RichUsersList from '@/components/admin/RichUsersList'

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
        <div className="grid h-screen w-screen grid-cols-[1fr] gap-6 overflow-hidden lg:grid-cols-[1fr,320px]">
          <div className="h-screen">
            <h1 className="flex h-12 w-full cursor-default items-center gap-2 border-b border-border1 px-4 text-lg shadow-lg">
              <Icon name="admin-panel" />
              Admin Panel
            </h1>
            <div className="flex h-[calc(100vh-3rem)] flex-row overflow-hidden">
              <AdminPanel />
            </div>
          </div>
          {/* <div className="flex h-screen flex-row overflow-hidden">
            <AdminPanel />
          </div> */}
          <div className="hidden lg:block">
            <RichUsersList />
          </div>
        </div>
      </AdminProvider>
    </SocketProvider>
  )
}
