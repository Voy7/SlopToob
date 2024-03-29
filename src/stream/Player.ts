import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Video from '@/stream/Video'
// import { broadcastStreamInfo } from '@/server/socket'
import { PlayerState } from '@/lib/enums'
import type { StreamInfo, StreamPlaying, StreamLoading, StreamError } from '@/typings/socket'
import { RichPlaylist, FileTree, ClientPlaylist } from '@/typings/types'
import Logger from '@/lib/Logger'

const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm']

// Main player (video) handler, singleton
export default new class Player {
  playing: Video | null = null
  queue: Video[] = []
  isPaused: boolean = false
  playlists: RichPlaylist[] = []

  constructor() {
    // Get all playlists on startup
    this.getPlaylists()
  }

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videos.map(video => video.path)
    }))
  }

  addVideo(video: Video) {
    this.queue.push(video)
    if (!this.playing) this.playNext()
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.playing = null
      return
    }

    const next = this.queue.shift()
    if (next) {
      this.playing = next
      const x = await this.playing.download()
      await this.playing.play()
    }
    // Start downloading next video in queue
    if (this.queue[0]) {
      this.queue[0].download()
    }
  }

  getStreamInfo(): StreamInfo {
    if (!this.playing || !this.playing.isReady) {
      return {
        state: PlayerState.Loading
      }
    }

    if (this.playing.error) {
      return {
        state: PlayerState.Error,
        error: this.playing.error
      }
    }

    return {
      state: PlayerState.Playing,
      id: this.playing.id,
      name: this.playing.path,
      path: `/stream-data/${this.playing.id}/video.m3u8`,
      currentSeconds: this.playing.currentSeconds,
      totalSeconds: this.playing.durationSeconds
    }
  }

  // Get all video files & directories in videos folder as a tree
  // Files are sorted by name, and are only video files
  // Tree can be infinite depth, get all files recursively
  async getVideosFileTree(): Promise<FileTree> {
    const rootPath = Env.VIDEOS_PATH
    
    const tree: FileTree = {
      isDirectory: true,
      name: 'Videos Root',
      path: rootPath,
      children: []
    }

    async function getChildren(path: string, parent: FileTree): Promise<number> {
      const files = await fs.readdir(path, { withFileTypes: true })
      for (const file of files) {
        const isDirectory = file.isDirectory()
        if (!isDirectory) {
          const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
          if (!VALID_EXTENSIONS.includes(ext)) continue
        }

        const item: FileTree = {
          isDirectory: isDirectory,
          name: file.name,
          path: `${path}/${file.name}`
        }

        if (isDirectory) {
          item.children = []
          const childrenCount = await getChildren(item.path, item)
          if (childrenCount === 0) continue
        }

        parent.children?.push(item)
      }

      parent.children?.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })

      return parent.children?.length || 0
    }

    await getChildren(rootPath, tree)

    return tree
  }

  async getPlaylists(): Promise<RichPlaylist[]> {
    const playlists = await prisma.playlist.findMany({
      include: { videos: true }
    })

    this.playlists = playlists
    return playlists
  }

  // Create new blank playlist, return ID
  async addPlaylist(name: string): Promise<string> {
    const playlist = await prisma.playlist.create({
      data: { name }
    })
    await this.getPlaylists()
    Logger.debug('Playlist added:', name)
    return playlist.id
  }

  // Delete playlist by ID
  async deletePlaylist(playlistID: string) {
    await prisma.playlist.delete({
      where: { id: playlistID }
    })
    await this.getPlaylists()
    Logger.debug('Playlist deleted:', playlistID)
  }

  // Change playlist name, return error as string if failed
  async editPlaylistName(playlistID: string, newName: string): Promise<string | void> {
    try {
      // Name must be between 3-30 characters
      if (newName.length < 3) throw new Error('Name must be at least 3 characters long.')
      if (newName.length > 30) throw new Error('Name must be at most 30 characters long.')

      // Check if name already exists
      const exists = this.playlists.find(playlist => playlist.name === newName)
      if (exists) throw new Error('Playlist name already taken.')

      await prisma.playlist.update({
        where: { id: playlistID },
        data: { name: newName }
      })
      await this.getPlaylists()
      Logger.debug(`Playlist (${playlistID}) name updated:`, newName)
    }
    catch (error: any) { return error.message }
  }

  // Set new videos for playlist
  async setPlaylistVideos(playlistID: string, newVideoPaths: string[]) {
    // Remove duplicate paths
    newVideoPaths = Array.from(new Set(newVideoPaths))

    // Overwrite all videos in playlist with new ones
    await prisma.video.deleteMany({
      where: { playlistID }
    })

    // Add new videos to playlist
    for (const path of newVideoPaths) {
      await prisma.video.create({
        data: { path, playlistID }
      })
    }
    await this.getPlaylists()
    Logger.debug(`Playlist (${playlistID}) videos updated:`, newVideoPaths)
  }
}