'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { VideoState } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import styles from './QueueList.module.scss'

const states: Record<VideoState, { name: string, color: string }> = {
  [VideoState.NotReady]: { name: 'Not Ready', color: 'gray' },
  [VideoState.Ready]: { name: 'Ready', color: 'lime' },
  [VideoState.Preparing]: { name: 'Transcoding', color: 'aqua' },
  [VideoState.Playing]: { name: 'Playing', color: 'lime' },
  [VideoState.Paused]: { name: 'Paused', color: 'white' },
  [VideoState.Finished]: { name: 'Finished', color: 'white' },
  [VideoState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { queue } = useAdminContext()

  return (
    <SettingGroup>
      <Header icon="menu">Queue ({queue.length})</Header>
      <div className={styles.queueItems}>
        {queue.map((video, index) => (
          <div key={video.id} className={styles.queueItem}>
            <span className={styles.number}>{index + 1}.</span>
            <div className={styles.column}>
              <p className={styles.name}>{video.name}</p>
              <div className={styles.state}>
                <div className={styles.dot} style={{ background: states[video.state].color }} />
                <p>{states[video.state].name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingGroup>
  )
}