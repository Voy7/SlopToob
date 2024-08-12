'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import VoteSkipButton from '@/components/stream/VoteSkipButton'
import styles from './InfoBody.module.scss'

// Under video section
export default function InfoBody() {
  const { streamInfo } = useStreamContext()

  const title = 'name' in streamInfo ? streamInfo.name : '[No Video]'
  const isBumper = 'isBumper' in streamInfo ? streamInfo.isBumper : false
  const id = 'path' in streamInfo ? streamInfo.path : 'None'

  return (
    <div className={styles.infoBody}>
      <div className={styles.title}>
        {isBumper && <span className={styles.bumper}>Bumper</span>}
        <h2>{title}</h2>
      </div>
      <VoteSkipButton />
    </div>
  )
}
