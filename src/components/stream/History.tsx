// 'use client'

import Icon from '@/components/ui/Icon'
import styles from './History.module.scss'

// Past videos history
export default function History() {
  return (
    <div className={styles.history}>
      <h3 className={styles.header}>
        <Icon name="files" />
        Stream History
      </h3>
      <p>(Feature Coming Soon)</p>
    </div>
  )
}