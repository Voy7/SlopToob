'use client'

import { signOut } from 'next-auth/react'
import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import styles from './Header.module.scss'

// Stream header component
export default function Header() {
  const { viewers, setShowAdminModal } = useStreamContext()

  return (
    <div className={styles.header}>
      <button>
        <Icon name="users" /> {viewers.length}
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
      <button onClick={() => setShowAdminModal(true)}>
        <Icon name="admin-panel" /> Admin Panel
      </button>
    </div>
  )
}