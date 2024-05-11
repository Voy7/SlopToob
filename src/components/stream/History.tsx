'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import styles from './History.module.scss'

// Past videos history
export default function History() {
  const { streamInfo } = useStreamContext()

  return (
    <div className={styles.history}>
      <h3 className={styles.header}>
        <Icon name="history" />
        Stream History
        <span>&bull; Last {streamInfo.history.length} videos</span>
      </h3>
      {streamInfo.history.length > 0 ? (
        <ol className={styles.items}>
          {streamInfo.history.map((video, index) => (
            <li key={index}><span>{index + 1}.</span> {video}</li>
          ))}
        </ol>
      ) : (
        <p className={styles.noVideos}>(No videos in history)</p>
      )}
    </div>
  )
}