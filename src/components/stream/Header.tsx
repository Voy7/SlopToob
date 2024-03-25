'use client'

import { signOut } from 'next-auth/react'
import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import styles from './Header.module.scss'

// Stream header component
export default function Header() {
  const { username, setShowUsernameModal, viewers } = useStreamContext()

  return (
    <div className={styles.header}>
      <button>
        <Icon name="users" /> {viewers.length}
      </button>
      <button onClick={() => setShowUsernameModal(true)}>
        <Icon name="user" /> {username}
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  )
}