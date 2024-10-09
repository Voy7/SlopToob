'use client'

import { useEffect, useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import { Msg } from '@/shared/enums'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import { StringOption } from '@/components/admin/common/StringOption'
import ButtonOption from '@/components/admin/common/ButtonOption'
import Button from '@/components/ui/Button'
import PlaylistFilePicker from '@/components/admin/PlaylistFilePicker'
import ActionModal from '@/components/ui/ActionModal'
import type { ClientPlaylist, EditPlaylistNamePayload } from '@/typings/socket'

export default function PlaylistEditor({ playlist }: { playlist: ClientPlaylist }) {
  const { socket } = useSocketContext()

  const [playlistName, setPlaylistName] = useState<string>(playlist.name)
  const [playlistNameError, setPlaylistNameError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [deletePlaylistLoading, setDeletePlaylistLoading] = useState<boolean>(false)
  const [deletePlaylistError, setDeletePlaylistError] = useState<string | null>(null)

  // If playlist changes, update playlist name
  useEffect(() => {
    if (playlistName === playlist.name) return
    setPlaylistName(playlist.name)
    setPlaylistNameError(null)
  }, [playlist.name])

  // Update playlist name when playlistName changes
  useEffect(() => {
    if (playlistName === playlist.name) return
    socket.emit(Msg.AdminEditPlaylistName, {
      playlistID: playlist.id,
      newName: playlistName
    } satisfies EditPlaylistNamePayload)
  }, [playlistName])

  // If event is received, it is an error
  useSocketOn(Msg.AdminEditPlaylistName, (error: string) => {
    setPlaylistNameError(error)
  })

  useSocketOn(Msg.AdminDeletePlaylist, (response: true | string) => {
    setDeletePlaylistLoading(false)
    if (response === true) return
    setDeletePlaylistError(response)
  })

  // Update and send out playlist name change when input is changed
  function onNameChange(value: string) {
    setPlaylistName(value)
    setPlaylistNameError(null)
  }

  // Delete playlist
  function deletePlaylist() {
    if (deletePlaylistLoading) return
    setDeletePlaylistLoading(true)
    socket.emit(Msg.AdminDeletePlaylist, playlist.id)
  }

  return (
    <div className="animate-fade-in mt-4 flex flex-col gap-4">
      <SettingGroup>
        <Header icon="playlist">Playlist Details</Header>
        <StringOption
          label="Playlist Name"
          value={playlistName}
          setValue={onNameChange}
          error={playlistNameError}
        />
      </SettingGroup>
      <SettingGroup>
        <Header icon="files">
          Selected Videos ({playlist.videoPaths.length.toLocaleString()})
        </Header>
        <PlaylistFilePicker key={playlist.id} playlist={playlist} />
      </SettingGroup>
      <SettingGroup>
        <ButtonOption label="Permanently delete this playlist." swapped={true}>
          <Button
            variant="danger"
            icon="delete"
            onClick={() => {
              setShowDeleteModal(true)
              setDeletePlaylistError(null)
            }}>
            Delete Playlist
          </Button>
        </ButtonOption>
      </SettingGroup>

      <ActionModal
        title="Delete Playlist"
        isOpen={showDeleteModal}
        setClose={() => setShowDeleteModal(false)}
        button={
          <Button
            variant="danger"
            icon="delete"
            loading={deletePlaylistLoading}
            onClick={deletePlaylist}>
            Delete
          </Button>
        }
        error={deletePlaylistError}>
        <p>Are you sure you want to delete the playlist "{playlist.name}"?</p>
      </ActionModal>
    </div>
  )
}
