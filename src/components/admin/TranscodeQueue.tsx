'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { JobState } from '@/lib/enums'
import styles from './QueueList.module.scss'

const states: Record<JobState, { name: string, color: string }> = {
  [JobState.Initializing]: { name: 'Initializing', color: 'gray' },
  [JobState.Idle]: { name: 'Idle', color: 'lime' },
  [JobState.AwaitingTranscode]: { name: 'Awaiting Transcode', color: 'aqua' },
  [JobState.Transcoding]: { name: 'Transcoding', color: 'cyan' },
  [JobState.CleaningUp]: { name: 'Cleaning Up', color: 'magenta' },
  [JobState.Finished]: { name: 'Finished', color: 'white' },
  [JobState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { transcodeQueue } = useAdminContext()

  return (
    <div className={styles.queueList}>
      <h3 className={styles.queueHeader}>Transcoding Jobs ({transcodeQueue.length}):</h3>
      <div className={styles.items}>
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
    </div>
  )
}