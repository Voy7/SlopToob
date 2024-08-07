'use client'

import { useSession, signOut } from 'next-auth/react'
import { useStreamContext } from '@/contexts/StreamContext'
import { AuthRole } from '@/lib/enums'
import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import styles from './Header.module.scss'

// Stream header component
export default function Header() {
  const session = useSession()
  const authUser = session.data?.user

  const { viewers, setShowAdminModal } = useStreamContext()

  return (
    <div className={styles.header}>
      <Link className={styles.logo} href="/home">
        <Image src="/logo.png" alt="Logo" width={30} height={30} />
        <h1>
          <span>Slop</span>Toob
        </h1>
      </Link>
      <div className={styles.right}>
        <Button
          style="normal"
          icon="logout"
          onClick={() => signOut()}
          className={styles.signOutButton}
        >
          Sign Out
        </Button>
        {authUser && authUser.role >= AuthRole.Admin && (
          <Button
            style="main"
            icon="admin-panel"
            onClick={() => setShowAdminModal(true)}
            className={styles.adminPanelButton}
          >
            Admin Panel
          </Button>
        )}
      </div>
    </div>
  )
}
