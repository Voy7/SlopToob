'use client'

import useToggleOption from '@/hooks/useToggleOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'

export default function SectionStream() {
  const cacheVideos = useToggleOption('cacheVideos')
  const cacheBumpers = useToggleOption('cacheBumpers')

  return (
    <>
      <h2>Caching</h2>
      <SettingGroup>
        <Header icon="cache">Caching</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
    </>
  )
}