import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Logger from '@/server/Logger'
import Checklist from '@/server/Checklist'
import Video from '@/stream/Video'
import PlayHistory from '@/stream/PlayHistory'
import VoteSkipHandler from '@/stream/VoteSkipHandler'
import Settings from '@/stream/Settings'
import SocketUtils from '@/lib/SocketUtils'
import Chat from '@/stream/Chat'
import { getNextBumper } from '@/stream/bumpers'
import { themes } from '@/stream/themes'
import { StreamState, Msg, VideoState } from '@/lib/enums'
import type { RichPlaylist, ClientPlaylist, ListOption, FileTreeNode } from '@/typings/types'
import type {
  SocketClient,
  ViewerStreamInfo,
  StreamOptions,
  BaseStreamInfo,
  AdminStreamInfo
} from '@/typings/socket'
import packageJSON from '@package' assert { type: 'json' }
import FileTreeHandler from './FileTreeHandler'

// Main player (video) handler, singleton
export default new (class Player {
  playing: Video | null = null
  queue: Video[] = []
  private playlists: RichPlaylist[] = []
  private activePlaylist: RichPlaylist | null = null
  private lastBumperDate: Date = new Date()

  // Get all playlists on startup
  async initialize() {
    Logger.debug('Initializing player handler...')
    await this.populatePlaylists()
    await this.setActivePlaylistID(Settings.activePlaylistID)
    Checklist.pass('playerReady', 'Stream player handler ready.')

    // Update video indexes when file tree changes
    FileTreeHandler.onTreeChange(() => {
      for (const playlist of this.playlists) {
        playlist.videoIndexes = FileTreeHandler.getPathIndexes(playlist.videos)
      }
      SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
    })
  }

  pause(): boolean {
    return this.playing?.pause() || false
  }
  unpause(): boolean {
    return this.playing?.unpause() || false
  }
  skip() {
    this.playing?.end()
  }

  private async playNext() {
    // Play bumper if enough time has passed
    if (
      Settings.bumpersEnabled &&
      this.lastBumperDate.getTime() + Settings.bumperIntervalMinutes * 60 * 1000 < Date.now()
    ) {
      const nextBumper = getNextBumper()
      if (nextBumper) {
        this.queue.unshift(nextBumper)
        this.lastBumperDate = new Date()
      }
    }

    if (this.queue.length === 0) {
      // Display 'no videos' error
      this.broadcastStreamInfo()
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
  populateRandomToQueue() {
    if (!this.activePlaylist) return
    if (this.queue.length == Settings.targetQueueSize) return

    if (this.queue.length > Settings.targetQueueSize) {
      this.queue = this.queue.slice(0, Settings.targetQueueSize)
      SocketUtils.broadcastAdmin(
        Msg.AdminQueueList,
        this.queue.map((video) => video.clientVideo)
      )
      return
    }

    const randomVideo = PlayHistory.getRandom(this.activePlaylist.videos)
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo))

    if (this.queue.length < Settings.targetQueueSize) {
      this.populateRandomToQueue()
    }
  }

  // Set playlist as active, and start playing it
  async setActivePlaylistID(playlistID: string, executedBy?: SocketClient) {
    const playlist = this.playlists.find((playlist) => playlist.id === playlistID) || null
    Logger.debug('Setting active playlist:', playlist?.name || 'None')

    const sendChangedMessage = () => {
      if (!Settings.sendAdminChangePlaylist) return
      if (!executedBy) return
      if (!playlist) return
      if (this.activePlaylist?.id === playlistID) return
      Chat.send({
        type: Chat.Type.AdminChangePlaylist,
        message: `${executedBy.username} set the playlist to: ${playlist.name}`
      })
    }
    sendChangedMessage()

    this.activePlaylist = playlist

    for (const video of this.queue) video.end()
    this.queue = [] // Clear queue when playlist changes
    this.populateRandomToQueue()

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
    SocketUtils.broadcastAdmin(
      Msg.AdminQueueList,
      this.queue.map((video) => video.clientVideo)
    )
  }

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videoIndexes
    }))
  }

  get listOptionPlaylists(): ListOption {
    return {
      list: this.playlists.map((playlist) => ({ name: playlist.name, id: playlist.id })),
      selectedID: Settings.activePlaylistID
    }
  }

  get listOptionThemes(): ListOption {
    return {
      list: themes,
      selectedID: Settings.streamTheme
    }
  }

  addVideo(video: Video) {
    Logger.debug('Adding video to queue:', video.name)
    this.queue.push(video)
    if (!this.playing) this.playNext()
    SocketUtils.broadcastAdmin(
      Msg.AdminQueueList,
      this.queue.map((video) => video.clientVideo)
    )
  }

  broadcastStreamInfo() {
    SocketUtils.broadcast(Msg.StreamInfo, this.clientStreamInfo)
    SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, this.adminStreamInfo)
  }

  private get baseStreamInfo(): BaseStreamInfo {
    if (!this.playing && this.queue.length === 0) {
      return {
        state: StreamState.Error,
        error: 'No videos in queue.'
      }
    }

    if (!this.playing) {
      return {
        state: StreamState.Error,
        error: 'No video playing.'
      }
    }

    if (this.playing.state === VideoState.Errored) {
      return {
        state: StreamState.Error,
        name: this.playing.name,
        error: this.playing.error || 'Unknown error occurred.' // Should never be null, but just in case
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
        totalSeconds: this.playing.durationSeconds
      }
    }

    return {
      state: StreamState.Loading,
      name: this.playing.name
    }
  }

  get clientStreamInfo(): ViewerStreamInfo {
    return {
      ...this.baseStreamInfo,
      ...this.clientStreamOptions
    }
  }

  get adminStreamInfo(): AdminStreamInfo {
    const info: AdminStreamInfo = { ...this.baseStreamInfo }
    if (this.playing) {
      info.transcodedSeconds = this.playing.job.availableSeconds
    }
    return info
  }

  private get clientStreamOptions(): StreamOptions {
    return {
      version: packageJSON.version,
      streamTheme: Settings.streamTheme,
      history: PlayHistory.clientHistory,
      chat: {
        showTimestamps: Settings.showChatTimestamps,
        showIdenticons: Settings.showChatIdenticons
      },
      voteSkip: {
        isEnabled: Settings.enableVoteSkip,
        isAllowed: VoteSkipHandler.isAllowed,
        allowedInSeconds: VoteSkipHandler.allowedInSeconds,
        currentCount: VoteSkipHandler.currentCount,
        requiredCount: VoteSkipHandler.requiredCount
      }
    }
  }

  private async populatePlaylists() {
    const dbPlaylists = await prisma.playlist.findMany()

    // Parse video paths & sort playlists by name
    this.playlists = dbPlaylists
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

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
  }

  // Create new blank playlist, return ID
  async addPlaylist(name: string): Promise<string> {
    this.checkPlaylistNameValid(name)
    const playlist = await prisma.playlist.create({
      data: { name }
    })

    this.playlists.push({ ...playlist, videos: [], videoIndexes: [] })
    this.playlists = this.playlists.sort((a, b) => a.name.localeCompare(b.name))

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
    Logger.debug('Playlist added:', name)
    return playlist.id
  }

  // Delete playlist by ID, return error as string if failed
  async deletePlaylist(playlistID: string): Promise<string | void> {
    try {
      await prisma.playlist.delete({
        where: { id: playlistID }
      })

      this.playlists = this.playlists.filter((playlist) => playlist.id !== playlistID)

      SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
      Logger.debug('Playlist deleted:', playlistID)
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

    const playlist = this.playlists.find((playlist) => playlist.id === playlistID)
    if (playlist) playlist.name = newName

    SocketUtils.broadcastAdmin(Msg.AdminPlaylists, this.clientPlaylists)
    Logger.debug(`Playlist (${playlistID}) name updated:`, newName)
  }

  private checkPlaylistNameValid(name: string) {
    if (name.length < 3) throw new Error('Name must be at least 3 characters long.')
    if (name.length > 30) throw new Error('Name must be at most 30 characters long.')
    if (this.playlists.find((playlist) => playlist.name === name))
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

    const playlist = this.playlists.find((playlist) => playlist.id === playlistID)
    if (!playlist)
      return Logger.warn(`Tried to set videos for non-existent playlist: ${playlistID}`)

    playlist.videos = newVideoPaths
    playlist.videoIndexes = newVideoPathsIndex

    await prisma.playlist.update({
      where: { id: playlistID },
      data: { videoPaths: newVideoPaths.join('|') }
    })

    Logger.debug(`Playlist (${playlistID}) videos updated: ${newVideoPaths.length}`)
  }
})()
