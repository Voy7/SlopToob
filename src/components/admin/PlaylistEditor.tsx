'use client'


import { useEffect, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FilePicker from '@/components/admin/FilePicker'
import styles from './PlaylistEditor.module.scss'
import type { ClientPlaylist, FileTree } from '@/typings/types'
import type { EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'

export default function PlaylistEditor({ playlist, fileTree }: { playlist: ClientPlaylist, fileTree: FileTree }) {
  const { socket } = useStreamContext()

  const [playlistName, setPlaylistName] = useState<string>(playlist.name)
  const [playlistNameError, setPlaylistNameError] = useState<string | null>(null)
  const [activePaths, setActivePaths] = useState<string[]>(playlist.videoPaths)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  // Update playlist name when playlistName changes
  useEffect(() => {
    if (playlistName === playlist.name) return
    const payload: EditPlaylistNamePayload = {
      playlistID: playlist.id,
      newName: playlistName
    }
    socket?.emit(SocketEvent.AdminEditPlaylistName, payload)

    // If event is received, it is an error
    socket?.on(SocketEvent.AdminEditPlaylistName, (error: string) => {
      setPlaylistNameError(error)
    })
  }, [playlistName])

  // Update playlist video paths when activePaths change
  useEffect(() => {
    if (activePaths === playlist.videoPaths) return
    const payload: EditPlaylistVideosPayload = {
      playlistID: playlist.id,
      newVideoPaths: activePaths
    }
    socket?.emit(SocketEvent.AdminEditPlaylistVideos, payload)
  }, [activePaths])

  // Update and send out playlist name change when input is changed
  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPlaylistName(event.target.value)
    setPlaylistNameError(null)
  }

  // Delete playlist
  function deletePlaylist() {
    socket?.emit(SocketEvent.AdminDeletePlaylist, playlist.id)
  }

  return (
    <>
      <div className={styles.playlistEditor}>
        <div className={styles.seperate}>
          <label className={styles.playlistName}>
            <span>Playlist Name</span>
            <input type="text" value={playlistName} onChange={onNameChange} autoFocus />
            <p className={playlistNameError ? styles.error : styles.success}>
              <Icon name={playlistNameError ? 'warning' : 'check'} />
              {playlistNameError}
            </p>
          </label>
          <Button style="danger" icon="delete" onClick={() => setShowDeleteModal(true)}>Delete Playlist</Button>
        </div>
        <p className={styles.selectedCount}>SELECTED VIDEOS ({activePaths.length}):</p>
        <FilePicker tree={fileTree} activePaths={activePaths} setActivePaths={setActivePaths} />
      </div>
      <Modal title="Delete Playlist" isOpen={showDeleteModal} setClose={() => setShowDeleteModal(false)}>
        <div className={styles.deletePlaylistModal}>
          <p>Are you sure you want to delete the playlist "{playlist.name}"?</p>
          <div className={styles.buttons}>
            <Button style="normal" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button style="danger" icon="delete" onClick={deletePlaylist}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}