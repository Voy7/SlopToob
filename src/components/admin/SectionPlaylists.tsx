'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'
import SelectDropdown from '@/components/ui/SelectDropdown'
import PlaylistEditor from '@/components/admin/PlaylistEditor'
import styles from './SectionPlaylists.module.scss'
import useSocketOn from '@/hooks/useSocketOn'

export default function SectionPlaylists() {
  const { playlists, selectedPlaylist, setSelectedPlaylist } = useAdminContext()
  const { socket } = useStreamContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addLoading, setAddLoading] = useState<boolean>(false)
  const [addError, setAddError] = useState<string | null>(null)

  function submitAddPlaylist(event: React.FormEvent) {
    event.preventDefault()
    if (addLoading) return
    setAddLoading(true)
    setAddError(null)
    const playlistName = (event.target as HTMLFormElement).playlistName.value
    socket.emit(Msg.AdminAddPlaylist, playlistName)
  }

  useSocketOn(Msg.AdminAddPlaylist, (response: string | { error: string }) => {
    setAddLoading(false)
    if (typeof response === 'string') { // New playlist ID
      setShowAddModal(false)
      setSelectedPlaylist(response)
      return
    }
    setAddError(response.error)
  })

  const activePlaylist = playlists.find(playlist => playlist.id === selectedPlaylist)

  return (
    <>
      {!playlists || !selectedPlaylist ? (
        <div className={styles.addFirstPlaylist}>
          <Icon name="playlist-add" className={styles.icon} />
          <p>No playlists yet, add one.</p>
          <Button style="main" icon="playlist-add" loading={addLoading} onClick={() => setShowAddModal(true)}>Add Playlist</Button>
        </div>
      ) : (
        <>
          <h2>Playlists ({playlists.length})</h2>
          <div className={styles.playlistNavbar}>
            <SelectDropdown text={activePlaylist?.name || 'None Selected'} icon="playlist">
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  className={selectedPlaylist === playlist.id ? `${styles.playlistItem} ${styles.selected}` : styles.playlistItem}
                  onClick={() => setSelectedPlaylist(playlist.id)}
                >{playlist.name}<span>{playlist.videoPaths.length} Videos</span></button>
              ))}
            </SelectDropdown>
            <Button style="main" icon="playlist-add" loading={addLoading} onClick={() => setShowAddModal(true)}>Add Playlist</Button>
          </div>
          {activePlaylist && <PlaylistEditor key={activePlaylist.id} playlist={activePlaylist} />}
        </>
      )}

      <ActionModal
        title="Add Playlist"
        isOpen={showAddModal}
        setClose={() => setShowAddModal(false)}
        width={360}
        button={<Button style="main" icon="playlist-add" loading={addLoading} isSubmit>Add Playlist</Button>}
        error={addError}
        formOnSubmit={submitAddPlaylist}
      >
        <p>Enter a name for the new playlist.</p>
        <label>
          <input type="text" name="playlistName" placeholder="New Playlist..." autoFocus />
        </label>
      </ActionModal>
    </>
  )
}