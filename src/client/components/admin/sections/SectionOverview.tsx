'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'
import SelectDropdown from '@/components/ui/SelectDropdown'
import SelectItem from '@/components/ui/SelectItem'
import SelectItemCheckbox from '@/components/ui/SelectItemCheckbox'

export default function SectionOverview() {
  const { playlists, activePlaylist, activeThemes, schedule } = useAdminContext()

  return (
    <LoadingBoundary>
      <MainHeader>Stream Overview</MainHeader>
      <StreamControls />
      {schedule.canBeSynced && (
        <div className="mb-4 rounded-lg border border-border1 p-2">
          <ScheduleSyncer />
        </div>
      )}
      <SettingGroup>
        <Header icon="playlist">Active Playlist</Header>
        <SelectDropdown
          label={
            playlists.find((playlist) => playlist.id === activePlaylist.value.selectedID)?.name ||
            'None'
          }
          icon="playlist">
          {playlists.map((playlist) => (
            <SelectItem
              key={playlist.id}
              label={playlist.name}
              subLabel={`${playlist.videoPaths.length.toLocaleString()} Videos`}
              active={activePlaylist.value.selectedID === playlist.id}
              onClick={() => activePlaylist.setValue(playlist.id)}
            />
          ))}
        </SelectDropdown>
        <Description>Playlist that will be used for the stream.</Description>
      </SettingGroup>
      <div className="h-4" />
      <SettingGroup>
        <Header icon="menu">Active Joke Themes</Header>
        <SelectDropdown
          label={
            activeThemes.value.selectedIDs.length
              ? `${activeThemes.value.selectedIDs.length} Active`
              : 'None Active'
          }
          icon="list">
          {activeThemes.value.list.map((theme) => (
            <SelectItemCheckbox
              key={theme.id}
              label={theme.name}
              active={activeThemes.value.selectedIDs.includes(theme.id)}
              onClick={(event) => {
                event.stopPropagation()
                activeThemes.toggle(theme.id)
              }}
            />
          ))}
        </SelectDropdown>
        <Description>Enable a funny theme for the stream.</Description>
      </SettingGroup>
      <div className="h-4" />
      <QueueList omitDetails={true} />
    </LoadingBoundary>
  )
}
