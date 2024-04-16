'use client'

import { SocketEvent } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import useListOption from '@/hooks/useListOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'

export default function SectionStream() {
  const activePlaylist = useListOption(SocketEvent.SettingActivePlaylist)
  const voteSkipEnabled = useToggleOption(SocketEvent.SettingAllowVoteSkip)
  const voteSkipPercentage = useNumberOption(SocketEvent.SettingVoteSkipPercentage)
  const targetQueueSize = useNumberOption(SocketEvent.SettingTargetQueueSize)
  const cacheVideos = useToggleOption(SocketEvent.SettingCacheVideos)
  const cacheBumpers = useToggleOption(SocketEvent.SettingCacheBumpers)
  const finishTranscode = useToggleOption(SocketEvent.SettingFinishTranscode)

  return (
    <>
      <h2>STREAM SETTINGS</h2>
      <StreamControls />
      <SettingGroup>
        <Header icon="playlist">ACTIVE PLAYLIST</Header>
        <ListOption {...activePlaylist} />
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="skip">VOTE SKIPPING</Header>
        <ToggleOption label="Enable Vote Skipping" {...voteSkipEnabled} />
        <NumberOption label="Vote Skip Percentage" type="percentage" {...voteSkipPercentage} />
        <Description>Allow users to vote to skip the current video.</Description>
      </SettingGroup>
        <NumberOption label="Target Queue Size" type="integer" {...targetQueueSize} />
      <SettingGroup>
        <Header icon="cache">CACHING</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <ToggleOption label="Finish Transcoding if Video is Skipped" {...finishTranscode} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
      <QueueList />
    </>
  )
}