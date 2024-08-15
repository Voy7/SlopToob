'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Button from '@/components/ui/Button'
import HeaderAdminDropdown from '@/components/stream/HeaderAdminDropdown'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import Icon from '@/components/ui/Icon'
import { themes } from '@/server/stream/themes'
import { twMerge } from 'tailwind-merge'

export default function HeaderAdminOptions() {
  const { setShowAdminModal } = useStreamContext()
  const { playlists, streamInfo } = useAdminContext()
  const { socket } = useSocketContext()

  const activeThemeName =
    themes.find((theme) => theme.id === streamInfo.activeThemeID)?.name || 'None'
  const activePlaylistName =
    playlists.find((playlist) => playlist.id === streamInfo.activePlaylistID)?.name || 'None'

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
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-bg3'
                )}
                onClick={() => socket.emit('setting.streamTheme', theme.id)}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <Icon
                    name={isActive ? 'radio-checked' : 'radio-unchecked'}
                    className="shrink-0 text-sm"
                  />
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">{theme.name}</p>
                </div>
              </div>
            )
          })}
        </HeaderAdminDropdown>
        <HeaderAdminDropdown title="Active Playlist" subtitle={activePlaylistName} icon="playlist">
          {playlists.map((playlist) => {
            const isActive = playlist.id === streamInfo.activePlaylistID
            return (
              <div
                key={playlist.id}
                className={twMerge(
                  'flex cursor-pointer items-center justify-between gap-4 bg-bg1 p-2 text-lg',
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-bg3'
                )}
                onClick={() => socket.emit('setting.activePlaylistID', playlist.id)}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <Icon
                    name={isActive ? 'radio-checked' : 'radio-unchecked'}
                    className="shrink-0 text-sm"
                  />
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">{playlist.name}</p>
                </div>
                <p className={twMerge('shrink-0 text-sm text-text3', isActive && 'text-white')}>
                  {playlist.videoPaths.length.toLocaleString()} Videos
                </p>
              </div>
            )
          })}
        </HeaderAdminDropdown>
      </div>
      <Button style="main" icon="admin-panel" onClick={() => setShowAdminModal(true)}>
        Admin Panel
      </Button>
    </>
  )
}
