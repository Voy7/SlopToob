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
      canEscapeKeyClose={false}>
      <div className="h-[calc(100vh-9rem)] w-[min(calc(100vw-2rem-2px),1100px)] overflow-y-auto md:h-[calc(100vh-4rem)]">
        <AdminPanel />
      </div>
    </Modal>
  )
}
