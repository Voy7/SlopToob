'use client'

import { signOut } from 'next-auth/react'
import { useStreamContext } from '@/contexts/StreamContext'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import styles from './Header.module.scss'

// Stream header component
export default function Header() {
  const { viewers, setShowAdminModal } = useStreamContext()

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <Image src="/logo.png" alt="Logo" width={30} height={30} />
        <h1>SlopToob</h1>
      </div>
      <div className={styles.right}>
        <button onClick={() => signOut()} className={styles.signOutButton}>
        <Icon name="user" />Sign Out
        </button>
        <button onClick={() => setShowAdminModal(true)} className={styles.adminPanelButton}>
          <Icon name="admin-panel" />Admin Panel
        </button>
      </div>
    </div>
  )
}