'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ListOption, useListOption } from '@/components/admin/common/ListOption'
import { MultiListOption, useMultiListOption } from '@/components/admin/common/MultiListOption'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'

export default function SectionOverview() {
  const { activePlaylist, activeThemes, schedule } = useAdminContext()

  return (
    <LoadingBoundary>
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
    </LoadingBoundary>
  )
}
