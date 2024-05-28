'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import Navbar from '@/components/admin/Navbar'
import Icon, { type IconNames } from '@/components/ui/Icon'
import SectionStream from '@/components/admin/SectionStream'
import SectionPlaylists from '@/components/admin/SectionPlaylists'
import SectionBumpers from '@/components/admin/SectionBumpers'
import SectionCaching from '@/components/admin/SectionCaching'
import SectionChat from '@/components/admin/SectionChat'
import SectionHistory from '@/components/admin/SectionHistory'
import SectionVoteSkip from '@/components/admin/SectionVoteSkip'
import SectionMonitor from '@/components/admin/SectionMonitor'
import SectionAdvanced from '@/components/admin/SectionAdvanced'
import Modal from '@/components/ui/Modal'
import styles from './AdminModal.module.scss'

// Admin panel sections
export const sections = [
  { name: 'Stream', icon: <Icon name="stream-settings" />, component: <SectionStream /> },
  { name: 'Playlists', icon: <Icon name="playlist" />, component: <SectionPlaylists /> },
  { name: 'Bumpers', icon: <Icon name="bumper" />, component: <SectionBumpers /> },
  { name: 'Caching', icon: <Icon name="cache" />, component: <SectionCaching /> },
  { name: 'Chat', icon: <Icon name="chat" />, component: <SectionChat /> },
  { name: 'History', icon: <Icon name="history" />, component: <SectionHistory /> },
  { name: 'Vote Skip', icon: <Icon name="skip" />, component: <SectionVoteSkip /> },
  { name: 'Monitor', icon: <Icon name="admin-panel" />, component: <SectionMonitor /> },
  { name: 'Advanced', icon: <Icon name="settings" />, component: <SectionAdvanced /> },
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