'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import Thumbnail from '@/components/stream/Thumbnail'
import styles from './History.module.scss'

// Past videos history
export default function History() {
  const { streamInfo } = useStreamContext()

  if (!streamInfo.history) return null

  return (
    <div className={styles.history}>
      <h3 className={styles.header}>
        <Icon name="history" />
        Stream History
        <span>&bull;</span>
        <span>Last {streamInfo.history.length} videos</span>
      </h3>
      {streamInfo.history.length > 0 ? (
        <ol className={styles.items}>
          {streamInfo.history.map((video, index) => (
            <li key={`${index}${video.name}`}>
              <span className={styles.index}>{index + 1}.</span>
              <Thumbnail src={video.thumbnailURL} height={50} />
              <div className={styles.details}>
                <p className={styles.title}>{video.name}</p>
                <div className={styles.row}>
                  <p className={styles.duration}>{video.totalDuration}</p>
                  {video.isBumper && (
                    <p className={styles.bumper}>
                      <Icon name="bumper" />
                      Bumper
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.noVideos}>(No videos in history)</p>
      )}
    </div>
  )
}
