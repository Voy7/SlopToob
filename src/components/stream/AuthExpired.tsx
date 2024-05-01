'use client'

import { signOut } from 'next-auth/react'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import styles from './AuthExpired.module.scss'

// Auth invalid/expired page component
export default function AuthExpired() {
  return (
    <div className={styles.authExpired}>
      <Icon name="warning" className={styles.icon} />
      <p>Your authentication is invalid or has expired.</p>
      <Button style="main" icon="logout" onClick={() => signOut()}>Sign in Again</Button>
    </div>
  )
}