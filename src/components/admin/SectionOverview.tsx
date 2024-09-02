'use client'

import useListOption from '@/hooks/useListOption'
import {
  MainHeader,
  SettingGroup,
  Header,
  Description,
  ListOption
} from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'

export default function SectionOverview() {
  const activePlaylist = useListOption('activePlaylistID')
  const activeTheme = useListOption('streamTheme')

  return (
    <>
      <MainHeader>Stream Overview</MainHeader>
      <StreamControls />
      <QueueList omitDetails={true} />
      <SettingGroup>
        <Header icon="playlist">Active Playlist</Header>
        <ListOption {...activePlaylist} />
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="menu">Joke Themes</Header>
        <ListOption {...activeTheme} />
        <Description>Enable a funny theme for the stream.</Description>
      </SettingGroup>
    </>
  )
}
