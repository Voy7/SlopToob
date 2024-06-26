'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { JobState } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import styles from './QueueList.module.scss'

const states: Record<JobState, { name: string, color: string }> = {
  [JobState.Initializing]: { name: 'Initializing', color: 'gray' },
  [JobState.Idle]: { name: 'Idle', color: 'gray' },
  [JobState.AwaitingTranscode]: { name: 'Awaiting Transcode', color: 'magenta' },
  [JobState.Transcoding]: { name: 'Transcoding', color: 'aqua' },
  [JobState.CleaningUp]: { name: 'Cleaning Up', color: 'orange' },
  [JobState.Finished]: { name: 'Finished', color: 'lime' },
  [JobState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { transcodeQueue } = useAdminContext()

  return (
    <SettingGroup>
      <Header icon="list">Transcoding Jobs ({transcodeQueue.length})</Header>
      <div className={styles.queueItems}>
        {transcodeQueue.map((video, index) => (
          <div key={video.name} className={styles.queueItem}>
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