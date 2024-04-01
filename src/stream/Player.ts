import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import { PlayerState, SocketEvent } from '@/lib/enums'
import type { StreamInfo } from '@/typings/socket'
import type { RichPlaylist, FileTree, ClientPlaylist } from '@/typings/types'

import { bumpers } from '@/stream/bumpers'
import Settings from './Settings'
import { broadcastAdmin } from '@/server/socket'

const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm']
const QUEUE_LENGTH = 4

// Main player (video) handler, singleton
export default new class Player {
  playing: Video | null = null
  queue: Video[] = []
  isPaused: boolean = false
  playlists: RichPlaylist[] = []
  private _activePlaylistID: string = 'None'

  constructor() {
    // Get all playlists on startup
    (async () => {
      Logger.debug('Player initialized')
      await this.getPlaylists()
      const settings = await Settings.getSettings()
      this.activePlaylistID = settings.activePlaylist
    })()
  }

  set activePlaylistID(playlistID: string) {
    this._activePlaylistID = playlistID
    Logger.debug('Active playlist set:', playlistID)

    this.queue = [] // Clear queue when playlist changes
    this.populateRandomToQueue()
  }

  get activePlaylistID(): string {
    return this._activePlaylistID
  }

  private populateRandomToQueue() {
    const playlist = this.playlists.find(playlist => playlist.id === this.activePlaylistID)
    if (!playlist) return

    if (this.queue.length >= QUEUE_LENGTH) return

    const randomVideo = playlist.videos[Math.floor(Math.random() * playlist.videos.length)]
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo.path))

    if (this.queue.length < QUEUE_LENGTH) {
      this.populateRandomToQueue()
    }
  }

  async setActivePlaylist(playlistID: string) {
    // Verify playlist exists
    const playlist = this.playlists.find(playlist => playlist.id === playlistID)
    console.log(playlistID, playlist)
    if (!playlist) return

    await Settings.setSetting('activePlaylist', playlistID)
    this.activePlaylistID = playlistID
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
    broadcastAdmin(SocketEvent.AdminQueueList, this.queue.map(video => video.clientVideo))
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
      this.populateRandomToQueue()
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
    newVideoPaths = Array.from(new Set(newVideoPaths)) // Remove duplicate paths

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