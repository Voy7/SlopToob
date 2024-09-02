'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Modal from '@/components/ui/Modal'
import AdminPanel from '@/components/admin/AdminPanel'

// Admin panel modal
export default function AdminModal() {
  const { showAdminModal, setShowAdminModal } = useStreamContext()

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          Admin Panel <span className="text-text3">&bull;</span>
          <a
            href="/admin"
            target="_blank"
            className="text-base text-blue-500 hover:underline"
            onClick={() => setShowAdminModal(false)}>
            Open in New Tab
          </a>
        </div>
      }
      isOpen={showAdminModal}
      setClose={() => setShowAdminModal(false)}
      canEscapeKeyClose={false}
      className="overflow-y-hidden">
      <div className="flex h-[calc(100vh-4rem)] w-[min(calc(100vw-2rem-2px),1100px)] flex-row md:h-[calc(100vh-9rem)]">
        <AdminPanel />
      </div>
    </Modal>
  )
}
