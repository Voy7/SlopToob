import Icon from '@/components/ui/Icon'
import styles from './SocketLoading.module.scss'

// Screen that shows when socket hasn't connected yet
export default function SocketLoading() {
  return (
    <div className={styles.loading}>
      <Icon name="loading" />
      <p>Connecting...</p>
    </div>
  )
}