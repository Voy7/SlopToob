import Events from '@/server/network/Events'
import Player from '@/server/stream/Player'
import Playlists from '@/server/stream/Playlists'
import { socketClients } from '@/server/network/socketClients'
import { AuthRole } from '@/shared/enums'
import type { EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'

// Admin adds a new playlist
Events.add(Events.Msg.AdminAddPlaylist, {
  adminOnly: true,
  run: async (socket, newPlaylistName: string) => {
    try {
      const newPlaylistID = await Playlists.addPlaylist(newPlaylistName)
      socket.emit(Events.Msg.AdminAddPlaylist, newPlaylistID)
    } catch (error: any) {
      socket.emit(Events.Msg.AdminAddPlaylist, { error: error.message })
    }
  }
})

// Admin deletes a playlist
Events.add(Events.Msg.AdminDeletePlaylist, {
  adminOnly: true,
  run: async (socket, playlistID: string) => {
    const errorMsg = await Playlists.deletePlaylist(playlistID)
    if (errorMsg) socket.emit(Events.Msg.AdminDeletePlaylist, errorMsg)
  }
})

// Admin edits a playlist name
Events.add(Events.Msg.AdminEditPlaylistName, {
  adminOnly: true,
  run: async (socket, payload: EditPlaylistNamePayload) => {
    try {
      await Playlists.editPlaylistName(payload.playlistID, payload.newName)
    } catch (error: any) {
      socket.emit(Events.Msg.AdminEditPlaylistName, error.message)
    }
  }
})

// Admin edits a playlist's videos, only send updated playlists to other admins
Events.add(Events.Msg.AdminEditPlaylistVideos, {
  adminOnly: true,
  run: async (socket, payload: EditPlaylistVideosPayload) => {
    await Playlists.setPlaylistVideos(payload.playlistID, payload.newVideoPaths)
    const senderClient = socketClients.find((c) => c.socket === socket)
    if (!senderClient) return
    for (const client of socketClients) {
      if (client === senderClient || client.role !== AuthRole.Admin) continue
      client.socket.emit(Events.Msg.AdminPlaylists, Player.clientPlaylists)
    }
  }
})
