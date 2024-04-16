'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import styles from './TranscodeQueue.module.scss'

export default function TranscodeQueue() {
  const { transcodeQueue } = useAdminContext()

  return (
    <div>
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