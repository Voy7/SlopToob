'use client'

import useNumberOption from '@/hooks/useNumberOption'
import useListOption from '@/hooks/useListOption'
import { SettingGroup, Header, Description, ToggleOption, ListOption, NumberOption } from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'

export default function SectionStream() {
  const activePlaylist = useListOption('activePlaylistID')
  const activeTheme = useListOption('streamTheme')

  return (
    <>
      <h2>Stream Settings</h2>
      <StreamControls />
      <SettingGroup>
        <Header icon="playlist">Active Playlist</Header>
        <ListOption {...activePlaylist} />
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <QueueList />
      <SettingGroup>
        <Header icon="menu">Joke Themes</Header>
        <ListOption {...activeTheme} />
        <Description>Enable a funny theme for the stream.</Description>
      </SettingGroup>
    </>
  )
}