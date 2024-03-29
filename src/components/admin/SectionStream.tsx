'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import styles from './SectionStream.module.scss'

export default function SectionStream() {
  const { playlists, selectedPlaylist, setSelectedPlaylist } = useAdminContext()
  const { socket } = useStreamContext()

  return (
    <div className={styles.sectionStream}>
      <h2>STREAM SETTINGS</h2>
      <div className={styles.activePlaylist}>
        <h3>Select Active Playlist</h3>
        {/* Radial button list */}
        <div className={styles.playlistList}>
          {playlists.map(playlist => (
            <input
              key={playlist.id}
              type="radio"
              id={playlist.id}
              name="playlist"
              checked={selectedPlaylist === playlist.id}
              onChange={() => setSelectedPlaylist(playlist.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}