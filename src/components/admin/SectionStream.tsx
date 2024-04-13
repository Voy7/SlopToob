'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import useToggleOption from '@/hooks/useToggleOption'
import { SocketEvent } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { SettingGroup, Header, Description, Toggle, ListOption } from '@/components/admin/SettingsComponents'
import styles from './SectionStream.module.scss'
import useListOption from '@/hooks/useListOption'

export default function SectionStream() {
  const { playlists, queue, transcodeQueue } = useAdminContext()
  const { socket } = useStreamContext()

  function pauseStream() {
    socket?.emit(SocketEvent.AdminPauseStream)
  }

  function unpauseStream() {
    socket?.emit(SocketEvent.AdminUnpauseStream)
  }

  function setActivePlaylist(playlistID: string) {
    socket?.emit(SocketEvent.AdminSetActivePlaylist, playlistID)
  }

  function skipVideo() {
    socket?.emit(SocketEvent.AdminSkipVideo)
  }

  const activePlaylist = useListOption(SocketEvent.AdminActivePlaylist)
  const cacheVideos = useToggleOption(SocketEvent.AdminCacheVideos)
  const cacheBumpers = useToggleOption(SocketEvent.AdminCacheBumpers)

  return (
    <div className={styles.sectionStream}>
      <h2>STREAM SETTINGS</h2>
      <Button style="normal" icon="pause" onClick={pauseStream}>Pause</Button>
      <Button style="normal" icon="play" onClick={unpauseStream}>Unpause</Button>
      <Button style="normal" icon="folder-open" onClick={skipVideo}>Skip</Button>
      <SettingGroup>
        <Header icon="playlist">ACTIVE PLAYLIST</Header>
        <ListOption {...activePlaylist} />
        <Description>Active playlist</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="folder-open">CACHING</Header>
        <Toggle label="Cache Videos" {...cacheVideos} />
        <Toggle label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
      <h3>Queue ({queue.length})</h3>
      <div className={styles.queueList}>
        {queue.map((video, index) => (
          <div key={video.id} className={styles.queueItem}>
            <span>{index + 1}.</span>
            <p>{video.name}</p>
          </div>
        ))}
      </div>
      <h3>Transcoding ({transcodeQueue.length})</h3>
      <div className={styles.queueList}>
        {transcodeQueue.map((video, index) => (
          <div key={index} className={styles.queueItem}>
            <span>{index + 1}.</span>
            <p>{video.name} - {video.inputPath}</p>
          </div>
        ))}
      </div>
    </div>
  )
}