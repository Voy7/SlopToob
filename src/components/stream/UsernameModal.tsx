'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { changeUsername } from '@/app/actions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from './UsernameModal.module.scss'
import { useState } from 'react'

// Change username modal prompt
export default function UsernameModal() {
  const { username, setUsername, showUsernameModal, setShowUsernameModal, socketSecret } = useStreamContext()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Submit new username
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const newUsername = formData.get('username') as string

    const result = await changeUsername(newUsername, socketSecret)

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }
    
    setUsername(newUsername)
    setShowUsernameModal(false)
  }

  return (
    <Modal title="Change Username" isOpen={showUsernameModal} setClose={() => setShowUsernameModal(false)}>
      <form onSubmit={submit}>
        <div className={styles.modalContent}>
          <p>({username}) Enter a new username:</p>
          <input type="text" name="username" defaultValue={username} />
        </div>
        <div className={styles.buttons}>
          <Button style="main" loading={loading} isSubmit>Save</Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </Modal>
  )
}