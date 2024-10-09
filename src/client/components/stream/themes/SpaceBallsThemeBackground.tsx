'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import styles from './SpaceBallsThemeBackground.module.scss'

export default function SpaceBallsThemeBackground() {
  const { streamInfo } = useStreamContext()
  if (!streamInfo.streamThemes.includes('SpaceBalls')) return

  return (
    <div
      className={`${styles.animation} fixed left-0 top-0 -z-10 h-full w-full bg-red-500 bg-[url(/theme-assets/space-balls-background.gif)] bg-cover bg-center`}></div>
  )
}
