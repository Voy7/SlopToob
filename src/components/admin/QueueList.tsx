'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import styles from './QueueList.module.scss'

export default function QueueList() {
  const { queue } = useAdminContext()

  return (
    <div className={styles.queueList}>
      {queue.map((video, index) => (
        <div key={video.id} className={styles.queueItem}>
          <span>{index + 1}.</span>
          <p>{video.name}</p>
        </div>
      ))}
    </div>
  )
}