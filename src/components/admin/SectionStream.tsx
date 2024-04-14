'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { SocketEvent } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import useListOption from '@/hooks/useListOption'
import { SettingGroup, Header, Description, Toggle, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import styles from './SectionStream.module.scss'

export default function SectionStream() {
  const { playlists, queue, transcodeQueue } = useAdminContext()

  const activePlaylist = useListOption(SocketEvent.SettingActivePlaylist)
  const voteSkipPercentage = useNumberOption(SocketEvent.SettingVoteSkipPercentage)
  const targetQueueSize = useNumberOption(SocketEvent.SettingTargetQueueSize)
  const cacheVideos = useToggleOption(SocketEvent.SettingCacheVideos)
  const cacheBumpers = useToggleOption(SocketEvent.SettingCacheBumpers)
  const finishTranscode = useToggleOption(SocketEvent.SettingFinishTranscode)

  return (
    <div className={styles.sectionStream}>
      <h2>STREAM SETTINGS</h2>
      <StreamControls />
      <SettingGroup>
        <Header icon="playlist">ACTIVE PLAYLIST</Header>
        <ListOption {...activePlaylist} />
        <Description>Active playlist</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="admin-panel">VOTE SKIP PERCENTAGE</Header>
        <NumberOption label="Vote Skip Percentage" allowFloat {...voteSkipPercentage} />
        <NumberOption label="Target Queue Size" {...targetQueueSize} />
        <Description>Percentage of users needed to skip a video</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="folder-open">CACHING</Header>
        <Toggle label="Cache Videos" {...cacheVideos} />
        <Toggle label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
      <Toggle label="Finish Transcoding if Video is Skipped" {...finishTranscode} />
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