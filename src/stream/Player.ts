import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import Settings from '@/stream/Settings'
import SocketUtils from '@/lib/SocketUtils'
import { getNextBumper } from '@/stream/bumpers'
import { StreamState, Msg, VideoState } from '@/lib/enums'
import type { RichPlaylist, FileTree, ClientPlaylist, ListOption } from '@/typings/types'
import type { StreamInfo, StreamOptions } from '@/typings/socket'
import VoteSkipHandler from './VoteSkipHandler'

// Main player (video) handler, singleton
export default new class Player {
  playing: Video | null = null
  queue: Video[] = []
  playlists: RichPlaylist[] = []
  private activePlaylist: RichPlaylist | null = null
  private lastBumperDate: Date = new Date()

  constructor() { this.initialize() }
  
  // Get all playlists on startup
  private async initialize() {
    Logger.debug('Initializing player handler...')
    await this.syncUpdatePlaylists()
    const { activePlaylistID } = Settings.getSettings()
    await this.setActivePlaylistID(activePlaylistID)
  }

  pause() { this.playing?.pause() }
  unpause() { this.playing?.unpause() }
  skip() { this.playing?.end() }

  async playNext() {
    // Play bumper if enough time has passed
    const { bumpersEnabled, bumperIntervalMinutes } = Settings.getSettings()
    if (bumpersEnabled && this.lastBumperDate.getTime() + bumperIntervalMinutes * 60 * 1000 < Date.now()) {
      const nextBumper = getNextBumper()
      if (nextBumper) {
        this.queue.unshift(nextBumper)
        this.lastBumperDate = new Date()
      }
    }

    if (this.queue.length === 0) { // Display 'no videos' error
      SocketUtils.broadcast(Msg.StreamInfo, this.clientStreamInfo)
      return
    }

    if (this.playing) {
      Logger.warn('Tried to play next video while one is already playing:', this.playing.name)
      return
    }
    
    this.playing = this.queue.shift() || null
    if (!this.playing) return
    
    this.populateRandomToQueue()
    this.playing.prepare()
    
    // Start transcoding next video in queue
    this.queue[0]?.prepare()

    await this.playing.play()
    this.playing = null
    this.playNext()
  }

  // Fill queue with random videos from active playlist
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
  async setActivePlaylistID(playlistID: string) {
    const playlist = this.playlists.find(playlist => playlist.id === playlistID) || null

    Logger.info('Setting active playlist:', playlist?.name || 'None')
    this.activePlaylist = playlist

    for (const video of this.queue) video.end()
    this.queue = [] // Clear queue when playlist changes
    this.populateRandomToQueue()

    SocketUtils.broadcastAdmin(Msg.AdminRequestPlaylists, this.clientPlaylists)
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.queue.map(video => video.clientVideo))
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
      selectedID: Settings.getSettings().activePlaylistID
    }
  }

  get listOptionThemes(): ListOption {
    return {
      list: [
        { name: 'None', id: 'None' },
        { name: 'Fox News', id: 'FoxNews' },
        { name: 'Saul Goodman', id: 'SaulGoodman' }
      ],
      selectedID: Settings.getSettings().streamTheme
    }
  }

  addVideo(video: Video) {
    Logger.debug('Adding video to queue:', video.name)
    this.queue.push(video)
    if (!this.playing) this.playNext()
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.queue.map(video => video.clientVideo))
  }

  get clientStreamInfo(): StreamInfo {
    if (!this.playing && this.queue.length === 0) {
      return {
        state: StreamState.Error,
        error: 'No videos in queue.',
        ...this.clientStreamOptions
      }
    }

    if (!this.playing) {
      return {
        state: StreamState.Error,
        error: 'No video playing.',
        ...this.clientStreamOptions
      }
    }

    if (this.playing.state === VideoState.Errored) {
      return {
        state: StreamState.Error,
        error: this.playing.error || 'Unknown error occurred.', // Should never be null, but just in case
        ...this.clientStreamOptions
      }
    }

    if (this.playing.state === VideoState.Playing || this.playing.state === VideoState.Paused) {
      return {
        state: this.playing.state === VideoState.Playing ? StreamState.Playing : StreamState.Paused,
        id: this.playing.id,
        name: this.playing.name,
        path: `/stream-data/${this.playing.id}/video.m3u8`,
        isBumper: this.playing.isBumper,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds,
        ...this.clientStreamOptions
      }
    }

    return {
      state: StreamState.Loading,
      name: this.playing.name,
      ...this.clientStreamOptions
    }
  }

  get clientStreamOptions(): StreamOptions {
    const { streamTheme, showChatTimestamps, showChatIdenticons, enableVoteSkip } = Settings.getSettings()

    return {
      streamTheme: streamTheme,
      chat: {
        showTimestamps: showChatTimestamps,
        showIdenticons: showChatIdenticons
      },
      voteSkip: {
        isEnabled: enableVoteSkip,
        isAllowed: VoteSkipHandler.isAllowed,
        allowedInSeconds: VoteSkipHandler.allowedInSeconds,
        currentCount: VoteSkipHandler.currentCount,
        requiredCount: VoteSkipHandler.requiredCount,
      }
    }
  }

  async syncUpdatePlaylists(): Promise<RichPlaylist[]> {
    const playlists = await prisma.playlist.findMany({
      include: { videos: true }
    })

    this.playlists = playlists
    SocketUtils.broadcastAdmin(Msg.AdminRequestPlaylists, this.clientPlaylists)
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
}