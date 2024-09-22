'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import useListOption from '@/hooks/useListOption'
import useMultiListOption from '@/hooks/useMultiListOption'
import {
  MainHeader,
  SettingGroup,
  Header,
  Description,
  ListOption,
  MultiListOption
} from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'

export default function SectionOverview() {
  const { schedule } = useAdminContext()

  const activePlaylist = useListOption('activePlaylistID')
  const activeThemes = useMultiListOption('activeThemes')

  return (
    <>
      <MainHeader>Stream Overview</MainHeader>
      <StreamControls />
      <QueueList omitDetails={true} />
      <SettingGroup>
        <Header icon="playlist">Active Playlist</Header>
        {schedule.canBeSynced && (
          <div className="mb-2">
            <ScheduleSyncer />
          </div>
        )}
        <ListOption {...activePlaylist} />
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="menu">Joke Themes</Header>
        <MultiListOption {...activeThemes} />
        <Description>Enable a funny theme for the stream.</Description>
      </SettingGroup>
    </>
  )
}
