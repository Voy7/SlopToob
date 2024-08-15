'use client'

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
import SectionDebug from '@/components/admin/SectionDebug'
import SectionAdvanced from '@/components/admin/SectionAdvanced'

type Section = {
  name: string
  icon: IconNames
  category: number
  component: React.ReactNode
}

// Admin panel sections
export const sections = [
  {
    name: 'Stream',
    icon: 'stream-settings',
    category: 1,
    component: <SectionStream />
  },
  {
    name: 'Playlists',
    icon: 'playlist',
    category: 1,
    component: <SectionPlaylists />
  },
  {
    name: 'Bumpers',
    icon: 'bumper',
    category: 1,
    component: <SectionBumpers />
  },
  {
    name: 'Caching',
    icon: 'cache',
    category: 1,
    component: <SectionCaching />
  },
  { name: 'Chat', icon: 'chat', category: 1, component: <SectionChat /> },
  {
    name: 'History',
    icon: 'history',
    category: 1,
    component: <SectionHistory />
  },
  {
    name: 'Vote Skip',
    icon: 'skip',
    category: 2,
    component: <SectionVoteSkip />
  },
  {
    name: 'Debug',
    icon: 'admin-panel',
    category: 3,
    component: <SectionDebug />
  },
  {
    name: 'Advanced',
    icon: 'settings',
    category: 3,
    component: <SectionAdvanced />
  }
] as const satisfies Section[]

export type SectionName = (typeof sections)[number]['name']

// Admin panel content
export default function AdminPanel() {
  const { section } = useAdminContext()

  return (
    <>
      <Navbar />
      <section
        key={section.name}
        className="sectionFadeInAnimation flex w-full flex-col gap-4 overflow-x-hidden overflow-y-scroll p-4">
        {section.component}
      </section>
    </>
  )
}
