'use client'

import { useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import Button from '@/components/ui/Button'
import HeaderAdminDropdown from '@/components/stream/HeaderAdminDropdown'
import HoverTooltip from '@/components/ui/HoverTooltip'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'
import SelectItem from '@/components/ui/SelectItem'
import SelectItemCheckbox from '@/components/ui/SelectItemCheckbox'

export default function HeaderAdminOptions() {
  const { setShowAdminModal } = useStreamContext()
  const { playlists, activePlaylist, activeThemes, streamInfo, schedule } = useAdminContext()
  const { socket } = useSocketContext()

  const [themesIsOpen, setThemesIsOpen] = useState<boolean>(false)
  const [playlistsIsOpen, setPlaylistsIsOpen] = useState<boolean>(false)

  // If pressing CTRL, open /admin in a new tab
  function openAdminPanel(event: React.MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      window.open('/admin')
      return
    }
    setShowAdminModal(true)
  }

  return (
    <>
      <div className="flex">
        <HeaderAdminDropdown
          isOpen={themesIsOpen}
          setIsOpen={setThemesIsOpen}
          title="Active Theme"
          subtitle={
            activeThemes.value.selectedIDs.length
              ? `${activeThemes.value.selectedIDs.length} Active`
              : 'None Active'
          }
          icon="list">
          <div className="my-2">
            {activeThemes.value.list.map((theme) => (
              <SelectItemCheckbox
                key={theme.id}
                label={theme.name}
                active={activeThemes.value.selectedIDs.includes(theme.id)}
                onClick={() => activeThemes.toggle(theme.id)}
              />
            ))}
          </div>
        </HeaderAdminDropdown>
        <HeaderAdminDropdown
          isOpen={playlistsIsOpen}
          setIsOpen={setPlaylistsIsOpen}
          title="Active Playlist"
          subtitle={
            playlists.find((playlist) => playlist.id === activePlaylist.value.selectedID)?.name ||
            'None'
          }
          icon="playlist">
          {schedule.canBeSynced && (
            <div className="mr-4 w-full bg-bg1 p-2">
              <ScheduleSyncer />
              <hr className="my-2 mb-0 border-border1" />
            </div>
          )}
          <div className="mb-2 w-full">
            {playlists.map((playlist) => (
              <SelectItem
                key={playlist.id}
                active={playlist.id === activePlaylist.value.selectedID}
                label={playlist.name}
                subLabel={`${playlist.videoPaths.length.toLocaleString()} Videos`}
                onClick={() => {
                  activePlaylist.setValue(playlist.id)
                  setPlaylistsIsOpen(false)
                }}
              />
            ))}
          </div>
        </HeaderAdminDropdown>
      </div>
      <div />
      <div>
        <HoverTooltip placement="bottom">CTRL + Click to open in new tab</HoverTooltip>
        <Button variant="main" icon="admin-panel" onClick={openAdminPanel}>
          Admin Panel
        </Button>
      </div>
      <div />
    </>
  )
}
