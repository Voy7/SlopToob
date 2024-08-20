import Logger from '@/server/Logger'
import Checklist from '@/server/Checklist'
import Playlists from '@/server/stream/Playlists'
import Video from '@/server/stream/Video'
import PlayHistory from '@/server/stream/PlayHistory'
import VoteSkipHandler from '@/server/stream/VoteSkipHandler'
import FileTreeHandler from '@/server/FileTreeHandler'
import Settings from '@/server/Settings'
import SocketUtils from '@/server/socket/SocketUtils'
import Chat from '@/server/stream/Chat'
import { getNextBumper } from '@/server/stream/bumpers'
import { themes } from '@/server/stream/themes'
import { StreamState, Msg, VideoState } from '@/lib/enums'
import type { RichPlaylist, ClientPlaylist, ClientVideo, ListOption } from '@/typings/types'
import type {
  SocketClient,
  BaseStreamInfo,
  ViewerStreamInfo,
  AdminStreamInfo,
  StreamOptions
} from '@/typings/socket'
import packageJSON from '@package' assert { type: 'json' }

// Main video player handler, singleton
export default new (class Player {
  playing: Video | null = null
  queue: Video[] = []
  playlists: RichPlaylist[] = []
  activePlaylist: RichPlaylist | null = null
  private lastBumperDate: Date = new Date()
  previousVideos: { path: string; isBumper: boolean; fromPlaylistID?: string }[] = []

  // Get all playlists on startup
  async initialize() {
    Logger.debug('[Player] Initializing player handler...')
    await Playlists.populatePlaylists()
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

  // Go to previous video, or seek to start if conditions met, returns true if previous video was played
  previous(): boolean {
    let previousVideo = this.previousVideos[this.previousVideos.length - 1]
    // In most cases, the previous video is the one that was just skipped and is in the array
    if (this.playing?.inputPath === previousVideo?.path) {
      previousVideo = this.previousVideos[this.previousVideos.length - 2]
    }

    // Seek to start if no previous videos
    if (this.playing && !previousVideo) {
      this.playing.seekTo(0)
      return false
    }
    // Seek to start if video has been playing for more than 5 seconds & passed duration as % is < 50%
    if (
      this.playing &&
      this.playing.currentSeconds > 5 &&
      this.playing.currentSeconds / this.playing.durationSeconds < 0.5
    ) {
      this.playing.seekTo(0)
      return false
    }

    this.addVideo(
      new Video(previousVideo.path, previousVideo.isBumper, previousVideo.fromPlaylistID),
      true
    )
    this.playing?.end()
    return true
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
      this.broadcastStreamInfo()
      return
    }

    if (this.playing) {
      Logger.warn('[Player] Tried to play video while one is already playing:', this.playing.name)
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

  // Add video to end of queue
  addVideo(video: Video, addToStart: boolean = false) {
    Logger.debug('[Player] Adding video to queue:', video.name)
    addToStart ? this.queue.unshift(video) : this.queue.push(video)
    if (!this.playing) this.playNext()
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
  }

  // Fill queue with random videos from active playlist
  populateRandomToQueue() {
    if (!this.activePlaylist) return
    if (this.queue.length == Settings.targetQueueSize) return

    if (this.queue.length > Settings.targetQueueSize) {
      while (this.queue.length > Settings.targetQueueSize) {
        this.queue.pop()?.end()
      }
      SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
      return
    }

    const randomVideo = PlayHistory.getRandom(this.activePlaylist.videos)
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo, false, this.activePlaylist.id))

    if (this.queue.length < Settings.targetQueueSize) {
      this.populateRandomToQueue()
    }
  }

  addPreviousVideo(video: Video) {
    if (this.previousVideos.length >= Settings.previousVideoLimit) {
      this.previousVideos.shift()
    }
    this.previousVideos.push({ path: video.inputPath, isBumper: video.isBumper })
  }

  updatedPreviousVideoLimit() {
    if (this.previousVideos.length > Settings.previousVideoLimit) {
      this.previousVideos = this.previousVideos.slice(0, Settings.previousVideoLimit)
    }
  }

  // Set playlist as active, and start playing it
  async setActivePlaylistID(playlistID: string, executedBy?: SocketClient) {
    const playlist = this.playlists.find((playlist) => playlist.id === playlistID) || null
    Logger.debug('[Player] Setting active playlist:', playlist?.name || 'None')

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
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
    SocketUtils.broadcastAdmin(Msg.AdminStreamInfo, this.adminStreamInfo)
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
        fromPlaylistName: this.playing.fromPlaylistName || undefined,
        error: this.playing.error || 'Unknown error occurred.' // Should never be null, but just in case
      }
    }

    if (this.playing.state === VideoState.Playing || this.playing.state === VideoState.Paused) {
      return {
        state: this.playing.state === VideoState.Playing ? StreamState.Playing : StreamState.Paused,
        id: this.playing.id,
        name: this.playing.name,
        fromPlaylistName: this.playing.fromPlaylistName || undefined,
        path: `/stream-data/${this.playing.job.streamID}/video.m3u8`,
        isBumper: this.playing.isBumper,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds,
        trueCurrentSeconds: this.playing.currentSeconds - this.playing.job.transcodedStartSeconds,
        trueTotalSeconds: this.playing.durationSeconds - this.playing.job.transcodedStartSeconds
      }
    }

    return {
      state: StreamState.Loading,
      name: this.playing.name,
      fromPlaylistName: this.playing.fromPlaylistName || undefined
    }
  }

  get clientStreamInfo(): ViewerStreamInfo {
    return {
      ...this.baseStreamInfo,
      ...this.clientStreamOptions
    }
  }

  get adminStreamInfo(): AdminStreamInfo {
    const info: AdminStreamInfo = {
      ...this.baseStreamInfo,
      activePlaylistID: this.activePlaylist?.id || 'None',
      activeThemeID: Settings.streamTheme,
      previousVideoExists: this.previousVideos.length > 0,
      appVersion: packageJSON.version
    }
    if (this.playing) {
      info.transcodedSeconds = this.playing.job.availableSeconds
    }
    return info
  }

  get clientStreamOptions(): StreamOptions {
    return {
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

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videoIndexes
    }))
  }

  get clientVideoQueue(): ClientVideo[] {
    return this.queue.map((video) => video.clientVideo)
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
})()
