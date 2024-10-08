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
        key={section.id}
        className="h-full w-full overflow-x-hidden overflow-y-scroll p-2 pb-8">
        {section.component}
      </section>
    </>
  )
}
