'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Modal from '@/components/ui/Modal'
import AdminPanel from '@/components/admin/AdminPanel'

// Admin panel modal
export default function AdminModal() {
  const { showAdminModal, setShowAdminModal } = useStreamContext()

  return (
    <Modal
      title="Admin Panel"
      isOpen={showAdminModal}
      setClose={() => setShowAdminModal(false)}
      canEscapeKeyClose={false}
    >
      <AdminPanel />
    </Modal>
  )
}
