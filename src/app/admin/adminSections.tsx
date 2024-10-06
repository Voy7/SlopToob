import SectionOverview from '@/components/admin/sections/SectionOverview'
import SectionPlaylists from '@/components/admin/sections/SectionPlaylists'
import SectionBumpers from '@/components/admin/sections/SectionBumpers'
import SectionSchedule from '@/components/admin/sections/SectionSchedule'
import SectionCaching from '@/components/admin/sections/SectionCaching'
import SectionDebug from '@/components/admin/sections/SectionDebug'
import SectionSettings from '@/components/admin/sections/SectionSettings'
import type { IconNames } from '@/components/ui/Icon'

type Section = {
  id: string
  name: string
  icon: IconNames
  accentColor: string
  component: React.ReactNode
}

// Admin panel sections
export const adminSections = [
  {
    id: 'overview',
    name: 'Overview',
    icon: 'stream-settings',
    accentColor: 'bg-gray-500',
    component: <SectionOverview />
  },
  {
    id: 'playlists',
    name: 'Playlists',
    icon: 'playlist',
    accentColor: 'bg-blue-500',
    component: <SectionPlaylists />
  },
  {
    id: 'bumpers',
    name: 'Bumpers',
    icon: 'bumper',
    accentColor: 'bg-blue-700',
    component: <SectionBumpers />
  },
  {
    id: 'schedule',
    name: 'Schedule',
    icon: 'calendar',
    accentColor: 'bg-yellow-500',
    component: <SectionSchedule />
  },
  {
    id: 'caching',
    name: 'Caching',
    icon: 'cache',
    accentColor: 'bg-purple-700',
    component: <SectionCaching />
  },
  {
    id: 'debug',
    name: 'Debug',
    accentColor: 'bg-red-500',
    icon: 'admin-panel',
    component: <SectionDebug />
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    accentColor: 'bg-red-500',
    component: <SectionSettings />
  }
] as const satisfies Section[]

export type AdminSectionID = (typeof adminSections)[number]['id']
