'use client'

import { useEffect, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from './BumpersList.module.scss'
import type { ClientBumper } from '@/typings/types'

export default function BumpersList() {
  const { socket } = useStreamContext()
  const { bumpers } = useAdminContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addBumperError, setAddBumperError] = useState<string | null>(null)
  const [addBumperLoading, setAddBumperLoading] = useState<boolean>(false)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [deleteBumperSelected, setDeleteBumperSelected] = useState<ClientBumper | null>(null)
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
  }

  async function deleteBumper() {
    if (deleteBumperLoading || !deleteBumperSelected) return
    setDeleteBumperLoading(true)
    setDeleteBumperError(null)
    socket?.emit(SocketEvent.AdminDeleteBumper, deleteBumperSelected.path)
  }

  useEffect(() => {
    // Response will either be true for success or string for error
    socket?.on(SocketEvent.AdminUploadBumper, (response: true | string) => {
      setAddBumperLoading(false)
      if (response === true) return setShowAddModal(false)
      setAddBumperError(response)
    })

    
    // Response will either be true for success or string for error
    socket?.on(SocketEvent.AdminDeleteBumper, (response: true | string) => {
      setDeleteBumperLoading(false)
      if (response === true) return setShowDeleteModal(false)
      setDeleteBumperError(response)
    })

    return () => {
      socket?.off(SocketEvent.AdminUploadBumper)
      socket?.off(SocketEvent.AdminDeleteBumper)
    }
  }, [])

  return (
    <>
      <SettingGroup>
        <div className={styles.options}>
          <Button style="main" icon="add" onClick={() => setShowAddModal(true)}>Upload Bumper</Button>
        </div>
        <Header icon="files">Bumpers List ({bumpers.length})</Header>
        <div className={styles.list}>
          {bumpers.map((bumper, index) => (
            <div key={bumper.path} className={styles.bumper}>
              <div className={styles.left}>
                <span>{index + 1}.</span>
                <p>{bumper.name}</p>
              </div>
              <button onClick={() => { setShowDeleteModal(true); setDeleteBumperSelected(bumper) }}>
                <Icon name="delete" />
              </button>
            </div>
          ))}
        </div>
      </SettingGroup>

      <Modal title="Upload Bumper" isOpen={showAddModal} setClose={() => setShowAddModal(false)}>
        <form onSubmit={addBumperSubmit} className={styles.addBumperModal}>
          <p>Upload a new bumper video.</p>
          <label>
            Bumper Title
            <input type="text" name="bumperName" placeholder="Enter title..." autoFocus />
          </label>
          <label>
            Video File
            <input type="file" accept="video/*" name="videoFile" />
          </label>
          <div className={styles.buttons}>
            <Button style="normal" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button style="main" icon="add" loading={addBumperLoading} isSubmit>Upload</Button>
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