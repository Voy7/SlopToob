import prisma from '@/lib/prisma'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Player from '@/server/stream/Player'
import SocketUtils from '@/server/socket/SocketUtils'
import FileTreeHandler from '@/server/FileTreeHandler'
import { Msg } from '@/lib/enums'
import type { FileTreeNode } from '@/typings/types'

// Mainly utility functions for playlists, singleton
// Actual state for playlists is stored in Player class
export default new (class Playlists {
  async populatePlaylists() {
    const dbPlaylists = await prisma.playlist.findMany()

    // Parse video paths & sort playlists by name
    Player.playlists = dbPlaylists
      .map((playlist) => {
        const paths = playlist.videoPaths.replace(/\\/g, '/').split('|')
        return {
          ...playlist,
          videoPaths: undefined,
          videos: paths,
          videoIndexes: FileTreeHandler.getPathIndexes(paths)
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, Player.clientPlaylists)
  }

  // Create new blank playlist, return ID
  async addPlaylist(name: string): Promise<string> {
    this.checkPlaylistNameValid(name)
    const playlist = await prisma.playlist.create({
      data: { name }
    })

    Player.playlists.push({ ...playlist, videos: [], videoIndexes: [] })
    Player.playlists = Player.playlists.sort((a, b) => a.name.localeCompare(b.name))

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, Player.clientPlaylists)
    Logger.debug('[Playlists] Playlist added:', name)
    return playlist.id
  }

  // Delete playlist by ID, return error as string if failed
  async deletePlaylist(playlistID: string): Promise<string | void> {
    try {
      await prisma.playlist.delete({
        where: { id: playlistID }
      })

      Player.playlists = Player.playlists.filter((playlist) => playlist.id !== playlistID)

      SocketUtils.broadcastAdmin(Msg.AdminPlaylists, Player.clientPlaylists)
      Logger.debug('[Playlists] Playlist deleted:', playlistID)
    } catch (error: any) {
      return error.message
    }
  }

  // Change playlist name, return error as string if failed
  async editPlaylistName(playlistID: string, newName: string) {
    this.checkPlaylistNameValid(newName)
    await prisma.playlist.update({
      where: { id: playlistID },
      data: { name: newName }
    })

    const playlist = Player.playlists.find((playlist) => playlist.id === playlistID)
    if (playlist) playlist.name = newName

    Logger.debug(`[Playlists] Playlist (${playlistID}) name updated:`, newName)
    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, Player.clientPlaylists)
    if (playlist === Player.activePlaylist) {
      Player.broadcastStreamInfo() // Update 'fromPlaylistName' streamInfo
    }
  }

  private checkPlaylistNameValid(name: string) {
    if (name.length < 3) throw new Error('Name must be at least 3 characters long.')
    if (name.length > 30) throw new Error('Name must be at most 30 characters long.')
    if (Player.playlists.find((playlist) => playlist.name === name))
      throw new Error('Playlist name already taken.')
  }

  // Set new videos for playlist
  async setPlaylistVideos(playlistID: string, newVideoPathsIndex: number[]) {
    newVideoPathsIndex = Array.from(new Set(newVideoPathsIndex)) // Remove duplicate paths

    const pathIndexes: string[] = []
    let index = 0
    function getPaths(item: FileTreeNode) {
      if (!item.children) {
        pathIndexes[index] = `${Env.VIDEOS_PATH}${item.path}`
        index++
      } else
        for (const child of item.children) {
          getPaths(child)
        }
    }
    getPaths(FileTreeHandler.tree)

    const newVideoPaths = newVideoPathsIndex
      .map((index) => pathIndexes[index])
      .filter((path) => path) // Remove undefined paths

    const playlist = Player.playlists.find((playlist) => playlist.id === playlistID)
    if (!playlist)
      return Logger.warn(`[Playlists] Tried to set videos for non-existent playlist: ${playlistID}`)

    playlist.videos = newVideoPaths
    playlist.videoIndexes = newVideoPathsIndex

    await prisma.playlist.update({
      where: { id: playlistID },
      data: { videoPaths: newVideoPaths.join('|') }
    })

    Logger.debug(`[Playlists] Playlist (${playlistID}) videos updated: ${newVideoPaths.length}`)
  }
})()
