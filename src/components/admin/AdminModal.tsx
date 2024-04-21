'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import Navbar from '@/components/admin/Navbar'
import Icon, { type IconNames } from '@/components/ui/Icon'
import SectionStream from '@/components/admin/SectionStream'
import SectionPlaylists from '@/components/admin/SectionPlaylists'
import SectionBumpers from '@/components/admin/SectionBumpers'
import SectionCaching from '@/components/admin/SectionCaching'
import SectionMonitor from '@/components/admin/SectionMonitor'
import Modal from '@/components/ui/Modal'
import styles from './AdminModal.module.scss'

// Admin panel sections
export const sections = [
  { name: 'Stream', icon: <Icon name="settings" />, component: <SectionStream /> },
  { name: 'Playlists', icon: <Icon name="playlist" />, component: <SectionPlaylists /> },
  { name: 'Bumpers', icon: <Icon name="video-file" />, component: <SectionBumpers /> },
  { name: 'Caching', icon: <Icon name="cache" />, component: <SectionCaching /> },
  { name: 'Monitor', icon: <Icon name="chat" />, component: <SectionMonitor /> },
] as const

export type SectionName = typeof sections[number]['name']

// Admin panel modal
export default function AdminModal() {
  const { showAdminModal, setShowAdminModal } = useStreamContext()
  const { section } = useAdminContext()

  return (
    <Modal
      title="Admin Panel"
      isOpen={showAdminModal}
      setClose={() => setShowAdminModal(false)}
      canEscapeKeyClose={false}
    >
      <div className={styles.adminModal}>
        <Navbar />
        <div key={section.name} className={styles.section}>
          {section.component}
        </div>
      </div>
    </Modal>
  )
}