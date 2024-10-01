'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'

export default function CachingSettings() {
  const cacheVideos = useToggleOption('cacheVideos')
  const cacheBumpers = useToggleOption('cacheBumpers')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="cache">Cache Settings</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
