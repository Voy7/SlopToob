'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import styles from './InfoBody.module.scss'
import { StreamState } from '@/lib/enums'

// Under video section
export default function InfoBody() {
  const { streamInfo } = useStreamContext()

  let title = ('name' in streamInfo) ? streamInfo.name : '[No Video]'

  return (
    <div className={styles.infoBody}>
      <h2>{title}</h2>
    </div>
  )
}