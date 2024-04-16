'use client'

import { SocketEvent } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import TranscodeQueue from '@/components/admin/TranscodeQueue'

export default function SectionStream() {
  const cacheVideos = useToggleOption(SocketEvent.SettingCacheVideos)
  const cacheBumpers = useToggleOption(SocketEvent.SettingCacheBumpers)
  const finishTranscode = useToggleOption(SocketEvent.SettingFinishTranscode)

  return (
    <>
      <h2>CACHE SETTINGS</h2>
      <SettingGroup>
        <Header icon="cache">CACHING</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <ToggleOption label="Finish Transcoding if Video is Skipped" {...finishTranscode} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
      <TranscodeQueue />
    </>
  )
}