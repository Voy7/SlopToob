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
      className="overflow-y-hidden">
      <div className="flex h-[calc(100vh-4rem)] w-[min(calc(100vw-2rem-2px),1100px)] flex-col md:h-[calc(100vh-9rem)] lg:flex-row">
        <AdminPanel />
      </div>
    </Modal>
  )
}
