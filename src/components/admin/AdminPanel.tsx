'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import Navbar from '@/components/admin/Navbar'

// Admin panel content
export default function AdminPanel() {
  const { section } = useAdminContext()

  return (
    <>
      <Navbar />
      <section
        key={section.name}
        className="animate-section flex h-full w-full flex-col gap-4 overflow-x-hidden overflow-y-scroll p-4">
        {section.component}
      </section>
    </>
  )
}
