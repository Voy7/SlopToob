'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from './BumpersList.module.scss'
import type { ActionResponse, ClientVideo } from '@/typings/types'

export default function BumpersList() {
  const { bumpers } = useAdminContext()
  const { socket } = useStreamContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addBumperError, setAddBumperError] = useState<string | null>(null)
  const [addBumperLoading, setAddBumperLoading] = useState<boolean>(false)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [deleteBumperSelected, setDeleteBumperSelected] = useState<ClientVideo | null>(null)
  const [deleteBumperLoading, setDeleteBumperLoading] = useState<boolean>(false)
  const [deleteBumperError, setDeleteBumperError] = useState<string | null>(null)

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

  async function deleteBumper() {
    if (deleteBumperLoading || !deleteBumperSelected) return
    setDeleteBumperLoading(true)
    setDeleteBumperError(null)
    socket?.emit(SocketEvent.AdminDeleteBumper, deleteBumperSelected.path)

    // Received event will either be an error or success acknowledgment
    socket?.on(SocketEvent.AdminDeleteBumper, (response: ActionResponse) => {
      setDeleteBumperLoading(false)
      if ('error' in response) {
        setDeleteBumperError(response.error)
        return
      }
      setShowDeleteModal(false)
    })
  }

  return (
    <>
      <div className={styles.sectionBumpers}>
        <div className={styles.options}>
          <Button style="main" icon="video-file" onClick={() => setShowAddModal(true)}>Add Bumper</Button>
        </div>
        <div className={styles.bumpersList}>
          {bumpers.map(bumper => (
            <div key={bumper.path} className={styles.bumper}>
              <div className={styles.left}>
                <Icon name="video-file" />
                <p>{bumper.name}</p>
              </div>
              <Button style="danger" icon="delete" onClick={() => { setShowDeleteModal(true); setDeleteBumperSelected(bumper) }}>Delete</Button>
            </div>
          ))}
        </div>
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

      {deleteBumperSelected && (
        <Modal title="Delete Bumper" isOpen={showDeleteModal} setClose={() => setShowDeleteModal(false)}>
          <div className={styles.deleteBumperModal}>
            <p>Are you sure you want to delete "{deleteBumperSelected.name}"?</p>
            <div className={styles.buttons}>
              <Button style="normal" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button style="danger" icon="delete" loading={deleteBumperLoading} onClick={deleteBumper}>Delete</Button>
            </div>
            {deleteBumperError && <p className={styles.error}><Icon name="warning" />{deleteBumperError}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}