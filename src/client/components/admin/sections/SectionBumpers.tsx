'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import JumpTo from '@/components/admin/common/JumpTo'
import BumpersList from '@/components/admin/BumpersList'

export default function SectionBumpers() {
  return (
    <LoadingBoundary>
      <MainHeader>Bumpers</MainHeader>
      <JumpTo settingsSection="bumpers" icon="settings">
        Go to Bumpers Settings
      </JumpTo>
      <div className="h-4" />
      <BumpersList />
    </LoadingBoundary>
  )
}
