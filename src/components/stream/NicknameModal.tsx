'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { changeNickname } from '@/app/actions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import styles from './NicknameModal.module.scss'

// Change username modal prompt
export default function NicknameModal() {
  const { nickname, setNickname, showNicknameModal, setShowNicknameModal, socketSecret } = useStreamContext()

  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Submit new username
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const result = await changeNickname(name, socketSecret)

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }
    
    setNickname(name)
    setShowNicknameModal(false)
  }

  return (
    <Modal title="Set Nickname" isOpen={showNicknameModal} setClose={() => setShowNicknameModal(false)}>
      <form onSubmit={submit} className={styles.nicknameModal}>
        <p>Enter a nickname to be displayed in chat.</p>
        <input
          type="text" name="nickname"
          placeholder="Enter a nickname..."
          value={name} onChange={event => setName(event.target.value)}
          autoFocus
        />
        <div className={styles.buttons}>
          <Button style="main" icon="edit" loading={loading} active={name.length > 0} isSubmit>Save Nickname</Button>
        </div>
        {error && <p className={styles.error}><Icon name="warning" />{error}</p>}
      </form>
    </Modal>
  )
}