'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { sections } from '@/components/admin/AdminPanel'
import styles from './Navbar.module.scss'

// Admin modal navbar
export default function Navbar() {
  const { section, setSection } = useAdminContext()
  return (
    <nav className={styles.navbar}>
      {sections.map((sec) => {
        const isActive = sec.name === section.name
        return (
          <button
            key={sec.name}
            className={isActive ? styles.active : ''}
            onClick={() => setSection(sec.name)}
          >
            {sec.icon}
            <span>{sec.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
