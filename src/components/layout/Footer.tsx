import styles from './Footer.module.scss'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <p>&copy; {year} &bull; Voy</p>
    </footer>
  )
}