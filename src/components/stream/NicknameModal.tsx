'use client'

import { useEffect, useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { setNicknameCookie } from '@/app/actions'
import { Msg } from '@/lib/enums'
import ActionModal from '@/components/ui/ActionModal'
import Button from '@/components/ui/Button'

// Change username modal prompt
export default function NicknameModal() {
  const { socket, setNickname, showNicknameModal, setShowNicknameModal } = useSocketContext()

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

    return () => {
      socket.off(Msg.ChangeNickname)
    }
  }, [name])

  return (
    <ActionModal
      title="Set Nickname"
      isOpen={showNicknameModal}
      setClose={() => setShowNicknameModal(false)}
      button={
        <Button style="main" icon="edit" loading={loading} active={name.length > 0} isSubmit>
          Save Nickname
        </Button>
      }
      error={error}
      formOnSubmit={submit}
      width={380}
    >
      <p>Enter a nickname to be displayed in chat.</p>
      <label>
        <input
          type="text"
          name="nickname"
          placeholder="Enter a nickname..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </label>
    </ActionModal>
  )
}
