'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import Navbar from '@/components/admin/Navbar'
import Icon from '@/components/ui/Icon'
import SectionStream from '@/components/admin/SectionStream'
import SectionPlaylists from '@/components/admin/SectionPlaylists'
import SectionBumpers from '@/components/admin/SectionBumpers'
import SectionCaching from '@/components/admin/SectionCaching'
import SectionChat from '@/components/admin/SectionChat'
import SectionHistory from '@/components/admin/SectionHistory'
import SectionVoteSkip from '@/components/admin/SectionVoteSkip'
import SectionDebug from '@/components/admin/SectionDebug'
import SectionAdvanced from '@/components/admin/SectionAdvanced'

// Admin panel sections
export const sections = [
  {
    name: 'Stream',
    icon: <Icon name="stream-settings" />,
    component: <SectionStream />
  },
  {
    name: 'Playlists',
    icon: <Icon name="playlist" />,
    component: <SectionPlaylists />
  },
  {
    name: 'Bumpers',
    icon: <Icon name="bumper" />,
    component: <SectionBumpers />
  },
  {
    name: 'Caching',
    icon: <Icon name="cache" />,
    component: <SectionCaching />
  },
  { name: 'Chat', icon: <Icon name="chat" />, component: <SectionChat /> },
  {
    name: 'History',
    icon: <Icon name="history" />,
    component: <SectionHistory />
  },
  {
    name: 'Vote Skip',
    icon: <Icon name="skip" />,
    component: <SectionVoteSkip />
  },
  {
    name: 'Monitor',
    icon: <Icon name="admin-panel" />,
    component: <SectionDebug />
  },
  {
    name: 'Advanced',
    icon: <Icon name="settings" />,
    component: <SectionAdvanced />
  }
] as const

export type SectionName = (typeof sections)[number]['name']

// Admin panel content
export default function AdminPanel() {
  const { section } = useAdminContext()

  return (
    <div className="flex flex-col lg:flex-row">
      <Navbar />
      <div
        key={section.name}
        className="sectionFadeInAnimation flex w-full flex-col gap-4 overflow-x-hidden p-4">
        {section.component}
      </div>
    </div>
  )
}
