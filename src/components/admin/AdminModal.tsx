'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import Navbar from '@/components/admin/Navbar'
import Icon, { type IconNames } from '@/components/ui/Icon'
import SectionPlaylists from '@/components/admin/SectionPlaylists'
import Modal from '@/components/ui/Modal'
import styles from './AdminModal.module.scss'

// Admin panel sections
export const sections = [
  { name: 'General', icon: <Icon name="settings" />, component: <div>GENERAL</div> },
  { name: 'Playlists', icon: <Icon name="playlist" />, component: <SectionPlaylists /> },
] as const

export type SectionName = typeof sections[number]['name']

// Admin panel modal
export default function AdminModal() {
  const { showAdminModal, setShowAdminModal } = useStreamContext()
  const { section } = useAdminContext()

  return (
    <Modal title="Admin Panel" isOpen={showAdminModal} setClose={() => setShowAdminModal(false)}>
      <div className={styles.adminModal}>
        <Navbar />
        {section.component}
      </div>
    </Modal>
  )
}