import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import { PlayerState, SocketEvent } from '@/lib/enums'
import type { StreamInfo } from '@/typings/socket'
import type { RichPlaylist, FileTree, ClientPlaylist } from '@/typings/types'

import { bumpers, nextBumper, queueNextBumper } from '@/stream/bumpers'
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
  private activePlaylist: RichPlaylist | null = null
  private lastBumperDate: Date = new Date()

  constructor() {
    // Get all playlists on startup
    (async () => {
      Logger.debug('Initializing player handler...')
      await this.getPlaylists()
      const settings = await Settings.getSettings()
      const playlist = this.playlists.find(playlist => playlist.id === settings.activePlaylistID) || null
      await this.setActivePlaylist(playlist)
    })()
  }

  pause() {
    this.isPaused = true
    if (this.playing) this.playing.pause()
  }

  unpause() {
    this.isPaused = false
    if (this.playing) this.playing.unpause()
  }

  skipVideo() {
    if (this.playing) {
      this.unpause()
      this.playing.forceFinish()
    }
  }

  async playNext() {
    // Play bumper if enough time has passed
    const { bumperIntervalSeconds } = await Settings.getSettings()
    if (nextBumper && this.lastBumperDate.getTime() + bumperIntervalSeconds * 1000 < Date.now()) {
      this.lastBumperDate = new Date()
      this.playing = nextBumper
      await this.playing.prepare()
      await this.playing.play()
      queueNextBumper()
      return
    }

    if (this.queue.length === 0) {
      this.playing = null
      return
    }

    if (this.playing) {
      Logger.warn('Tried to play next video while one is already playing:', this.playing.name)
      return
    }

    const next = this.queue.shift()
    if (next) {
      this.playing = next
      const x = await this.playing.prepare()
      try {
        await this.playing.play()
        console.log('VIDEO ENDED'.yellow)
        this.playing = null
        this.populateRandomToQueue()
        this.playNext()

      }
      catch (error) {
        // Handle error
      }
    }
    // Start downloading next video in queue
    if (this.queue[0]) {
      this.queue[0].prepare()
    }
  }

  private populateRandomToQueue() {
    if (!this.activePlaylist) return

    if (this.queue.length >= QUEUE_LENGTH) return

    const randomVideo = this.activePlaylist.videos[Math.floor(Math.random() * this.activePlaylist.videos.length)]
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo.path))

    if (this.queue.length < QUEUE_LENGTH) {
      this.populateRandomToQueue()
    }
  }

  // Set playlist as active, and start playing it
  async setActivePlaylist(playlist: RichPlaylist | null) {
    Logger.debug('Setting active playlist:', playlist?.name || 'None')
    await Settings.setSetting('activePlaylistID', playlist?.id || 'None')
    this.activePlaylist = playlist

    this.queue = [] // Clear queue when playlist changes
    this.populateRandomToQueue()
  }

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videos.map(video => video.path)
    }))
  }

  addVideo(video: Video) {
    Logger.debug('Adding video to queue:', video.name)
    this.queue.push(video)
    if (!this.playing) this.playNext()
    broadcastAdmin(SocketEvent.AdminQueueList, this.queue.map(video => video.clientVideo))
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

    if (this.isPaused) {
      return {
        state: PlayerState.Paused,
        id: this.playing.id,
        name: this.playing.path,
        path: `/stream-data/${this.playing.id}/video.m3u8`,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds
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