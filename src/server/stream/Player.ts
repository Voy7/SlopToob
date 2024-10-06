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
import Schedule from '@/server/stream/Schedule'
import Themes from '@/server/stream/Themes'
import { getNextBumper } from '@/server/stream/bumpers'
import { StreamState, Msg, VideoState } from '@/lib/enums'
import type { RichPlaylist, ListOption } from '@/typings/types'
import type {
  SocketClient,
  BaseStreamInfo,
  ViewerStreamInfo,
  AdminStreamInfo,
  StreamOptions,
  ClientPlaylist,
  ClientVideo
} from '@/typings/socket'
import packageJSON from '@package' assert { type: 'json' }

// Main video player handler, singleton
class Player {
  playing: Video | null = null
  queue: Video[] = []
  playlists: RichPlaylist[] = []
  activePlaylist: RichPlaylist | null = null
  private lastBumperDate: Date = new Date()
  private previousVideos: { path: string; isBumper: boolean; fromPlaylistID?: string }[] = []
  private omitBumpersNextPlay: boolean = false

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
    const previousVideo = this.previousVideos[this.previousVideos.length - 1]

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

    this.previousVideos.pop()
    if (this.playing) {
      this.addVideo(
        new Video(this.playing.inputPath, this.playing.isBumper, this.playing.fromPlaylistID),
        true
      )
    }
    this.addVideo(
      new Video(previousVideo.path, previousVideo.isBumper, previousVideo.fromPlaylistID),
      true
    )
    this.omitBumpersNextPlay = true
    this.playing?.end(true)
    return true
  }

  private async playNext() {
    if (this.shouldPlayBumper()) {
      const nextBumper = getNextBumper()
      if (nextBumper) {
        this.queue.unshift(nextBumper)
        this.lastBumperDate = new Date()
      }
    }

    this.omitBumpersNextPlay = false

    if (this.queue.length === 0) {
      this.broadcastStreamInfo()
      SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
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

  // Logic for if should play bumper or not
  private shouldPlayBumper(): boolean {
    if (this.omitBumpersNextPlay) return false
    if (!Settings.bumpersEnabled) return false
    if (this.lastBumperDate.getTime() + Settings.bumperIntervalMinutes * 60 * 1000 >= Date.now())
      return false
    // If next video in queue is a bumper, let it play normally instead of injecting a new one
    if (this.queue[0]?.isBumper) return false
    return true
  }

  // Add video to queue
  addVideo(video: Video, addToStart: boolean = false) {
    Logger.debug('[Player] Adding video to queue:', video.name)
    addToStart ? this.queue.unshift(video) : this.queue.push(video)
    if (!this.playing) this.playNext()
    SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
  }

  // Fill queue with random videos from active playlist
  populateRandomToQueue() {
    if (!this.activePlaylist) return
    if (this.queue.length >= Settings.targetQueueSize) return

    // if (this.queue.length > Settings.targetQueueSize) {
    //   while (this.queue.length > Settings.targetQueueSize) {
    //     this.queue.pop()?.end()
    //   }
    //   SocketUtils.broadcastAdmin(Msg.AdminQueueList, this.clientVideoQueue)
    //   return
    // }

    const randomVideo = PlayHistory.getRandom(this.activePlaylist.videos)
    if (!randomVideo) return

    this.addVideo(new Video(randomVideo, false, this.activePlaylist.id))

    if (this.queue.length < Settings.targetQueueSize) {
      this.populateRandomToQueue()
    }
  }

  // Remove video from queue
  removeVideoFromQueue(videoID: string) {
    const videoIndex = this.queue.findIndex((video) => video.id === videoID)
    if (videoIndex === -1) return
    this.queue[videoIndex].end()
    this.queue.splice(videoIndex, 1)
    this.populateRandomToQueue()
  }

  addPreviousVideo(video: Video) {
    if (this.previousVideos.length >= Settings.previousVideoLimit) {
      this.previousVideos.shift()
    }
    this.previousVideos.push({
      path: video.inputPath,
      isBumper: video.isBumper,
      fromPlaylistID: video.fromPlaylistID
    })
  }

  updatedPreviousVideoLimit() {
    if (this.previousVideos.length > Settings.previousVideoLimit) {
      this.previousVideos = this.previousVideos.slice(0, Settings.previousVideoLimit)
    }
  }

  // Set playlist as active, and start playing it
  // NOTE: Do NOT call this function directly, use Settings.set('activePlaylistID', id) instead
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

    Schedule.unsyncCheck(playlistID)

    this.activePlaylist = playlist

    for (const video of this.queue) video.end()
    this.queue = [] // Clear queue when playlist changes
    this.populateRandomToQueue()

    // Skip current video if below conditions ar met (Mainly for Playlist Scheduler)
    const skipCurrentVideo = () => {
      if (Settings.streamIsPaused) return
      if (SocketUtils.watchingClients.length > 0) return
      this.playing?.end()
    }
    skipCurrentVideo()

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
        isBumper: this.playing.isBumper || undefined,
        fromPlaylistName: this.playing.fromPlaylistName || undefined,
        error: this.playing.error || 'Unknown error occurred.' // Should never be null, but just in case
      }
    }

    if (this.playing.state === VideoState.Playing || this.playing.state === VideoState.Paused) {
      if (this.playing.isBuffering) {
        return {
          state: StreamState.Buffering,
          id: this.playing.id,
          name: this.playing.name,
          isBumper: this.playing.isBumper,
          fromPlaylistName: this.playing.fromPlaylistName || undefined,
          path: `/stream-data/${this.playing.job.streamID}/video.m3u8`,
          currentSeconds: this.playing.currentSeconds,
          totalSeconds: this.playing.durationSeconds,
          trueCurrentSeconds: this.playing.currentSeconds - this.playing.job.transcodedStartSeconds,
          trueTotalSeconds: this.playing.durationSeconds - this.playing.job.transcodedStartSeconds
        }
      }

      return {
        state: this.playing.state === VideoState.Playing ? StreamState.Playing : StreamState.Paused,
        id: this.playing.id,
        name: this.playing.name,
        isBumper: this.playing.isBumper,
        fromPlaylistName: this.playing.fromPlaylistName || undefined,
        path: `/stream-data/${this.playing.job.streamID}/video.m3u8`,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds,
        trueCurrentSeconds: this.playing.currentSeconds - this.playing.job.transcodedStartSeconds,
        trueTotalSeconds: this.playing.durationSeconds - this.playing.job.transcodedStartSeconds
      }
    }

    if (this.playing.state === VideoState.Seeking) {
      return {
        state: StreamState.Seeking,
        name: this.playing.name,
        isBumper: this.playing.isBumper,
        fromPlaylistName: this.playing.fromPlaylistName || undefined,
        currentSeconds: this.playing.currentSeconds,
        totalSeconds: this.playing.durationSeconds
      }
    }

    return {
      state: StreamState.Loading,
      name: this.playing.name,
      isBumper: this.playing.isBumper,
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
      previousVideoExists: this.previousVideos.length > 0,
      appVersion: packageJSON.version
    }
    if (this.playing) {
      info.transcodedSeconds = this.playing.job.availableSeconds
    }
    return info
  }

  get clientStreamOptions(): StreamOptions {
    const options: StreamOptions = {
      streamThemes: Themes.activeThemes,
      history: PlayHistory.clientHistory,
      chat: {
        showTimestamps: Settings.showChatTimestamps,
        showIdenticons: Settings.showChatIdenticons
      }
    }
    const voteSkipOptions = VoteSkipHandler.voteSkipOptions
    if (voteSkipOptions) options.voteSkip = voteSkipOptions
    return options
  }

  get clientPlaylists(): ClientPlaylist[] {
    return this.playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      videoPaths: playlist.videoIndexes
    }))
  }

  get clientVideoQueue(): ClientVideo[] {
    const list: ClientVideo[] = []
    if (this.playing) list.push(this.playing.clientVideo)
    for (const video of this.queue) list.push(video.clientVideo)
    return list
  }

  get listOptionPlaylists(): ListOption {
    return {
      list: this.playlists.map((playlist) => ({ name: playlist.name, id: playlist.id })),
      selectedID: Settings.activePlaylistID
    }
  }
}

export default new Player()
