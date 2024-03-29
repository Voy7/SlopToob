'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from './SectionBumpers.module.scss'
import { ActionResponse } from '@/typings/types'

export default function SectionBumpers() {
  // const { playlists, selectedPlaylist, setSelectedPlaylist } = useAdminContext()
  const { socket } = useStreamContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addBumperError, setAddBumperError] = useState<string | null>(null)
  const [addBumperLoading, setAddBumperLoading] = useState<boolean>(false)

  async function addBumperSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (addBumperLoading) return
    setAddBumperLoading(true)
    setAddBumperError(null)

    const form = event.currentTarget as HTMLFormElement
    const bumperName = (form.elements.namedItem('bumperName') as HTMLInputElement).value
    const videoFile = (form.elements.namedItem('videoFile') as HTMLInputElement).files?.[0]

    const videoFileBase64 = await new Promise<string | null>((resolve) => {
      if (!videoFile) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(videoFile)
    })

    socket?.emit(SocketEvent.AdminUploadBumper, { name: bumperName, videoFile: videoFileBase64 })

    // Received event will either be an error or success acknowledgment
    socket?.on(SocketEvent.AdminUploadBumper, (response: ActionResponse) => {
      setAddBumperLoading(false)
      if ('error' in response) return setAddBumperError(response.error)
      setShowAddModal(false)
    })
  }

  return (
    <>
      <div className={styles.sectionBumpers}>
        <h2>BUMPERS</h2>
        <Button style="main" icon="video-file" onClick={() => setShowAddModal(true)}>Add Bumper</Button>
      </div>
      <Modal title="Add Bumper" isOpen={showAddModal} setClose={() => setShowAddModal(false)}>
        <form onSubmit={addBumperSubmit} className={styles.addBumperModal}>
          <p>Upload a new bumper video.</p>
          <label>
            Bumper Name
            <input type="text" name="bumperName" />
          </label>
          <label>
            Video File
            <input type="file" accept="video/*" name="videoFile" />
          </label>
          <div className={styles.buttons}>
            <Button style="normal" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button style="main" icon="video-file" loading={addBumperLoading} isSubmit>Upload</Button>
          </div>
          {addBumperError && <p className={styles.error}><Icon name="warning" />{addBumperError}</p>}
        </form>
      </Modal>
    </>
  )
}