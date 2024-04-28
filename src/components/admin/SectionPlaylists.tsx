'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import PlaylistEditor from '@/components/admin/PlaylistEditor'
import styles from './SectionPlaylists.module.scss'

export default function SectionPlaylists() {
  const { playlists, selectedPlaylist, setSelectedPlaylist } = useAdminContext()
  const { socket } = useStreamContext()

  const [addLoading, setAddLoading] = useState<boolean>(false)
  // const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  // No playlists exist, show add first playlist button
  if (!playlists || !selectedPlaylist) {
    return (
      <div className={styles.addFirstPlaylist}>
        <Icon name="playlist-add" className={styles.icon} />
        <p>No playlists yet, add one.</p>
        <Button style="main" icon="playlist-add" loading={addLoading} onClick={addPlaylist}>Add Playlist</Button>
      </div>
    )
  }

  function addPlaylist() {
    if (addLoading) return
    setAddLoading(true)
    socket?.emit(SocketEvent.AdminAddPlaylist, 'New Playlist')
    
    // New playlist request was successful, stop loading
    socket?.on(SocketEvent.AdminAddPlaylist, (newPlaylistID: string) => {
      setAddLoading(false)
      setSelectedPlaylist(newPlaylistID)
    })
  }

  const activePlaylist = playlists.find(playlist => playlist.id === selectedPlaylist)

  return (
    <>
      <h2>PLAYLISTS ({playlists.length})</h2>
      <div className={styles.playlistNavbar}>
        <div className={styles.playlists}>
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              className={selectedPlaylist === playlist.id ? styles.selected : undefined}
              onClick={() => setSelectedPlaylist(playlist.id)}
            >{playlist.name}<span>{playlist.videoPaths.length}</span></button>
          ))}
        </div>
        <Button style="main" icon="playlist-add" loading={addLoading} onClick={addPlaylist}>Add Playlist</Button>
      </div>
      {activePlaylist && (
        <PlaylistEditor key={activePlaylist.id} playlist={activePlaylist} />
      )}
    </>
  )
}