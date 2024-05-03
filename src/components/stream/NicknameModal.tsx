'use client'

import { useEffect, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { setNicknameCookie } from '@/app/actions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import styles from './NicknameModal.module.scss'
import { Msg } from '@/lib/enums'

// Change username modal prompt
export default function NicknameModal() {
  const { socket, setNickname, showNicknameModal, setShowNicknameModal } = useStreamContext()

  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Submit new username
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    socket.emit(Msg.ChangeNickname, name)
  }

  useEffect(() => {
    // Response is 'true' if successful, string if error
    socket.on(Msg.ChangeNickname, async (result: true | string) => {
      setLoading(false)
      if (result !== true) {
        setError(result)
        return
      }

      setNickname(name)
      setShowNicknameModal(false)

      // Set cookie for future visits
      await setNicknameCookie(name)
    })

    return () => { socket.off(Msg.ChangeNickname) }
  }, [name])

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