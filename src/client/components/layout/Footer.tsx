import Image from 'next/image'
import styles from './Footer.module.scss'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.createdBy}>
        <Image src="/logo.png" alt="Logo" width={30} height={30} />
        &copy; Created by Voy.
      </p>
      <a
        className={styles.github}
        href="https://github.com/Voy7/SlopToob"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Source Code
        <Image src="/github.png" alt="Github logo" width={30} height={30} />
      </a>
    </footer>
  )
}
