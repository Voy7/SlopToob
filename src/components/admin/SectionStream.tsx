'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import styles from './SectionStream.module.scss'

export default function SectionStream() {
  const { playlists, queue } = useAdminContext()
  const { socket } = useStreamContext()

  function setActivePlaylist(playlistID: string) {
    socket?.emit(SocketEvent.AdminSetActivePlaylist, playlistID)
  }

  return (
    <div className={styles.sectionStream}>
      <h2>STREAM SETTINGS</h2>
      <div className={styles.activePlaylist}>
        <h3>Select Active Playlist</h3>
        {/* Radial button list */}
        <div className={styles.playlistList}>
          {playlists.map(playlist => (
            <Button
              key={playlist.id}
              style="normal"
              icon="playlist"
              onClick={() => setActivePlaylist(playlist.id)}
            >{playlist.name}</Button>
          ))}
        </div>
      </div>
      <h3>Queue ({queue.length})</h3>
      <div className={styles.queueList}>
        {queue.map((video, index) => (
          <div key={video.path} className={styles.queueItem}>
            <span>{index + 1}.</span>
            <p>{video.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}