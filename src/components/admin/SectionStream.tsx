'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import useListOption from '@/hooks/useListOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'

export default function SectionStream() {
  const activePlaylist = useListOption('activePlaylistID')
  const voteSkipEnabled = useToggleOption('allowVoteSkip')
  const voteSkipPercentage = useNumberOption('voteSkipPercentage')
  const targetQueueSize = useNumberOption('targetQueueSize')

  return (
    <>
      <h2>STREAM SETTINGS</h2>
      <StreamControls />
      <QueueList />
      <SettingGroup>
        <Header icon="playlist">ACTIVE PLAYLIST</Header>
        <ListOption {...activePlaylist} />
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <NumberOption label="Target Queue Size" type="integer" {...targetQueueSize} />
      <SettingGroup>
        <Header icon="skip">VOTE SKIPPING</Header>
        <ToggleOption label="Enable Vote Skipping" {...voteSkipEnabled} />
        <NumberOption label="Vote Skip Percentage" type="percentage" {...voteSkipPercentage} />
        <Description>Allow users to vote to skip the current video.</Description>
      </SettingGroup>
    </>
  )
}