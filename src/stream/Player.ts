import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import { StreamState, SocketEvent } from '@/lib/enums'
import type { StreamInfo } from '@/typings/socket'
import type { RichPlaylist, FileTree, ClientPlaylist, ListOption } from '@/typings/types'

import { bumpers, nextBumper, queueNextBumper } from '@/stream/bumpers'
import Settings from './Settings'
import SocketUtils from '@/lib/SocketUtils'

const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm']
// const QUEUE_LENGTH = 4

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
      await this.syncUpdatePlaylists()
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
    const { bumperIntervalMinutes } = Settings.getSettings()
    if (nextBumper && this.lastBumperDate.getTime() + bumperIntervalMinutes * 60 * 1000 < Date.now()) {
      this.queue.unshift(nextBumper)
      this.lastBumperDate = new Date()
      queueNextBumper()
    }
    // if (nextBumper && this.lastBumperDate.getTime() + bumperIntervalSeconds * 1000 < Date.now()) {
    //   this.lastBumperDate = new Date()
    //   this.playing = nextBumper
    //   await this.playing.prepare()
    //   await this.playing.play()
    //   queueNextBumper()
    //   return
    // }

    if (this.queue.length === 0) {
      this.playing = null
      // Display 'no videos' error
      SocketUtils.broadcastStreamInfo()
      return
    }

    if (this.playing) {
      Logger.warn('Tried to play next video while one is already playing:', this.playing.name)
      return
    }
    
    const next = this.queue.shift()
    if (next) {
      this.playing = next
      await this.playing.prepare()
      try {
        await this.playing.play()
        this.playing = null
        this.populateRandomToQueue()
        this.playNext()

      }
      catch (error) {
        // Handle error
      }
    }

    // Starttranscoding next video in queue
    this.queue[0]?.prepare()
  }

  private populateRandomToQueue() {
    if (!this.activePlaylist) return

    const { targetQueueSize } = Settings.getSettings()
    if (this.queue.length >= targetQueueSize) return

    const randomVideo = this.activePlaylist.videos[Math.floor(Math.random() * this.activePlaylist.videos.length)]
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo.path))

    if (this.queue.length < targetQueueSize) {
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

    SocketUtils.broadcastAdmin(SocketEvent.AdminRequestPlaylists, this.clientPlaylists)
    SocketUtils.broadcastAdmin(SocketEvent.SettingActivePlaylist, this.listOptionPlaylists)
  }

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videos.map(video => video.path)
    }))
  }

  get listOptionPlaylists(): ListOption {
    return {
      list: this.playlists.map(playlist => ({ name: playlist.name, id: playlist.id })),
      selectedID: this.activePlaylist?.id || 'None'
    }
  }

  addVideo(video: Video) {
    Logger.debug('Adding video to queue:', video.name)
    this.queue.push(video)
    if (!this.playing) this.playNext()
    SocketUtils.broadcastAdmin(SocketEvent.AdminQueueList, this.queue.map(video => video.clientVideo))
  }

  getStreamInfo(): StreamInfo {
    if (!this.playing && this.queue.length === 0) {
      return {
        state: StreamState.Error,
        error: 'No videos in queue.'
      }
    }

    if (!this.playing || !this.playing.isReady) {
      return {
        state: StreamState.Loading
      }
    }

    if (this.playing.error) {
      return {
        state: StreamState.Error,
        error: this.playing.error
      }
    }

    if (this.isPaused) {
      return {
        state: StreamState.Paused,
        id: this.playing.id,
        name: this.playing.name,
        path: `/stream-data/${this.playing.id}/video.m3u8`,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds
      }
    }

    return {
      state: StreamState.Playing,
      id: this.playing.id,
      name: this.playing.name,
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
        const isDirectory: boolean = file.isDirectory()
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

  async syncUpdatePlaylists(): Promise<RichPlaylist[]> {
    const playlists = await prisma.playlist.findMany({
      include: { videos: true }
    })

    this.playlists = playlists
    SocketUtils.broadcastAdmin(SocketEvent.AdminRequestPlaylists, this.clientPlaylists)
    return playlists
  }

  // Create new blank playlist, return ID
  async addPlaylist(name: string): Promise<string> {
    const playlist = await prisma.playlist.create({
      data: { name }
    })
    Logger.debug('Playlist added:', name)
    await this.syncUpdatePlaylists()
    return playlist.id
  }

  // Delete playlist by ID
  async deletePlaylist(playlistID: string) {
    await prisma.playlist.delete({
      where: { id: playlistID }
    })
    Logger.debug('Playlist deleted:', playlistID)
    await this.syncUpdatePlaylists()
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
      Logger.debug(`Playlist (${playlistID}) name updated:`, newName)
      await this.syncUpdatePlaylists()
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
    Logger.debug(`Playlist (${playlistID}) videos updated:`, newVideoPaths)
    await this.syncUpdatePlaylists()
  }

  // setCacheVideos(value: boolean) {
  //   Settings.setSetting('cacheVideos', value)
  //   SocketUtils.broadcastAdmin(SocketEvent.AdminCacheVideos, value)
  // }

  // setCacheBumpers(value: boolean) {
  //   Settings.setSetting('cacheBumpers', value)
  //   SocketUtils.broadcastAdmin(SocketEvent.AdminCacheBumpers, value)
  // }
}