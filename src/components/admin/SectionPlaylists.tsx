'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import FilePicker from '@/components/admin/FilePicker'
import styles from './SectionPlaylists.module.scss'
import { useStreamContext } from '@/contexts/StreamContext'
import { SocketEvent } from '@/lib/enums'

export default function SectionPlaylists() {
  const { playlists, selectedPlaylist, setSelectedPlaylist, fileTree } = useAdminContext()
  const { socket } = useStreamContext()

  // No playlists exist, show add first playlist button
  if (!playlists || !selectedPlaylist) {
    return (
      <div className={styles.addFirstPlaylist}>
        <Icon name="playlist-add" className={styles.icon} />
        <p>No playlists yet, add one.</p>
        <Button style="main" icon="playlist-add" onClick={addPlaylist}>Add Playlist</Button>
      </div>
    )
  }

  function addPlaylist() {
    socket?.emit(SocketEvent.AdminAddPlaylist, 'New Playlist')
  }

  return (
    <div className={styles.sectionPlaylists}>
      <h2>PLAYLISTS ({playlists.length})</h2>
      <div className={styles.top}>
        <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)}>
          {playlists.map(playlist => (
            <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
          ))}
        </select>
        <Button style="main" icon="add">Add Playlist</Button>
      </div>
      {fileTree ? (
        <FilePicker tree={fileTree} />
      ) : (
        <div>LOADING...</div>
      )}
    </div>
  )
}