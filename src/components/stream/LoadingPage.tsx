import Icon from '@/components/ui/Icon'
import styles from './LoadingPage.module.scss'

// Screen that shows when socket hasn't connected yet
export default function LoadingPage({ text }: { text: string }) {
  return (
    <div className={styles.loading}>
      <Icon name="loading" />
      <p>{text}</p>
    </div>
  )
}
