'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import Button from '@/components/ui/Button'
import HeaderAdminDropdown from '@/components/stream/HeaderAdminDropdown'
import Icon from '@/components/ui/Icon'
import Checkbox from '@/components/ui/Checkbox'
import HoverTooltip from '@/components/ui/HoverTooltip'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'
import { themes } from '@/lib/themes'
import { twMerge } from 'tailwind-merge'

export default function HeaderAdminOptions() {
  const { setShowAdminModal } = useStreamContext()
  const { playlists, streamInfo, schedule } = useAdminContext()
  const { socket } = useSocketContext()

  const activeThemeName =
    themes.find((theme) => theme.id === streamInfo.activeThemeID)?.name || 'None'
  const activePlaylistName =
    playlists.find((playlist) => playlist.id === streamInfo.activePlaylistID)?.name || 'None'

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
        <HeaderAdminDropdown title="Active Theme" subtitle={activeThemeName} icon="list">
          {themes.map((theme) => {
            const isActive = theme.id === streamInfo.activeThemeID
            return (
              <div
                key={theme.id}
                className={twMerge(
                  'flex cursor-pointer items-center justify-between gap-4 bg-bg1 p-2 text-lg',
                  isActive ? 'bg-bg2 text-white' : 'hover:bg-bg2'
                )}
                onClick={() => socket.emit('setting.streamTheme', theme.id)}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <Checkbox checked={isActive} />
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">{theme.name}</p>
                </div>
              </div>
            )
          })}
        </HeaderAdminDropdown>
        <HeaderAdminDropdown title="Active Playlist" subtitle={activePlaylistName} icon="playlist">
          {schedule.canBeSynced && (
            <div className="sticky top-0 w-full bg-bg1 p-2">
              <ScheduleSyncer />
              <hr className="my-2 mb-0 border-border1" />
            </div>
          )}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            {playlists.map((playlist) => {
              const isActive = playlist.id === streamInfo.activePlaylistID
              return (
                <div
                  key={playlist.id}
                  className={twMerge(
                    'flex w-full cursor-pointer items-center justify-between gap-4 bg-bg1 p-2 text-lg',
                    isActive ? 'bg-blue-500 text-white' : 'hover:bg-bg2'
                  )}
                  onClick={() => socket.emit('setting.activePlaylistID', playlist.id)}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon
                      name={isActive ? 'radio-checked' : 'radio-unchecked'}
                      className={twMerge('shrink-0 text-sm text-text3', isActive && 'text-white')}
                    />
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {playlist.name}
                    </p>
                  </div>
                  <p className={twMerge('shrink-0 text-sm text-text3', isActive && 'text-white')}>
                    {playlist.videoPaths.length.toLocaleString()} Videos
                  </p>
                </div>
              )
            })}
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
