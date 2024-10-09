'use client'

import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { Msg } from '@/shared/enums'
import useSocketOn from '@/hooks/useSocketOn'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'
import SelectDropdown from '@/components/ui/SelectDropdown'
import SelectItem from '@/components/ui/SelectItem'
import PlaylistEditor from '@/components/admin/PlaylistEditor'

export default function SectionPlaylists() {
  const { playlists, selectedPlaylist, setSelectedPlaylist } = useAdminContext()
  const { socket } = useSocketContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addLoading, setAddLoading] = useState<boolean>(false)
  const [addError, setAddError] = useState<string | null>(null)

  function submitAddPlaylist(event: React.FormEvent) {
    event.preventDefault()
    if (addLoading) return
    setAddLoading(true)
    setAddError(null)
    const playlistName = (event.target as HTMLFormElement).playlistName.value
    socket.emit(Msg.AdminAddPlaylist, playlistName)
  }

  useSocketOn(Msg.AdminAddPlaylist, (response: string | { error: string }) => {
    setAddLoading(false)
    if (typeof response === 'string') {
      // New playlist ID
      setShowAddModal(false)
      setSelectedPlaylist(response)
      return
    }
    setAddError(response.error)
  })

  const activePlaylist = playlists.find((playlist) => playlist.id === selectedPlaylist)

  return (
    <LoadingBoundary>
      {!playlists || !selectedPlaylist ? (
        <div className="mb-2 flex h-full w-full cursor-default flex-col items-center justify-center gap-4 p-4 text-xl text-text3">
          <Icon name="playlist-add" className="text-4xl" />
          <p>No playlists yet, add one.</p>
          <Button
            variant="main"
            icon="playlist-add"
            loading={addLoading}
            onClick={() => setShowAddModal(true)}>
            Add Playlist
          </Button>
        </div>
      ) : (
        <>
          <MainHeader>Playlists ({playlists.length})</MainHeader>
          <div className="flex items-center justify-between gap-2 border-b border-border1 pb-2">
            <SelectDropdown label={activePlaylist?.name || 'None Selected'} icon="playlist">
              {playlists.map((playlist) => (
                <SelectItem
                  key={playlist.id}
                  active={selectedPlaylist === playlist.id}
                  label={playlist.name}
                  subLabel={`${playlist.videoPaths.length.toLocaleString()} Videos`}
                  onClick={() => setSelectedPlaylist(playlist.id)}
                />
              ))}
            </SelectDropdown>
            <Button
              variant="main"
              icon="playlist-add"
              loading={addLoading}
              onClick={() => setShowAddModal(true)}>
              Add Playlist
            </Button>
          </div>
          {activePlaylist && <PlaylistEditor key={activePlaylist.id} playlist={activePlaylist} />}
        </>
      )}

      <ActionModal
        title="Add Playlist"
        isOpen={showAddModal}
        setClose={() => setShowAddModal(false)}
        width={360}
        button={
          <Button variant="main" icon="playlist-add" loading={addLoading} isSubmit>
            Add Playlist
          </Button>
        }
        error={addError}
        formOnSubmit={submitAddPlaylist}>
        <p>Enter a name for the new playlist.</p>
        <label>
          <input type="text" name="playlistName" placeholder="New Playlist..." autoFocus />
        </label>
      </ActionModal>
    </LoadingBoundary>
  )
}
