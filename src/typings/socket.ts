import type { Socket } from 'socket.io'
import type { CacheID } from '@/server/stream/CacheHandler'
import type { AuthRole, StreamState, VideoState, JobState, ChatType } from '@/lib/enums'

export type { CacheID }

export type StreamPlaying = {
  state: StreamState.Playing
  id: string
  name: string
  path: string
  isBumper: boolean
  currentSeconds: number
  totalSeconds: number
  trueCurrentSeconds: number
  trueTotalSeconds: number
}

export type StreamPaused = {
  state: StreamState.Paused
  id: string
  name: string
  path: string
  isBumper: boolean
  currentSeconds: number
  totalSeconds: number
  trueCurrentSeconds: number
  trueTotalSeconds: number
}

export type StreamLoading = {
  state: StreamState.Loading
  name: string
}

export type StreamError = {
  state: StreamState.Error
  name?: string
  error: string
}

export type StreamOptions = {
  streamTheme: string
  history: ClientHistoryItem[] | null
  chat: {
    showTimestamps: boolean
    showIdenticons: boolean
  }
  voteSkip: {
    isEnabled: boolean
    isAllowed: boolean
    allowedInSeconds: number
    currentCount: number
    requiredCount: number
  }
}

export type BaseStreamInfo = {
  fromPlaylistName?: string
} & (StreamPlaying | StreamPaused | StreamLoading | StreamError)

export type ViewerStreamInfo = BaseStreamInfo & StreamOptions

export type AdminStreamInfo = {
  transcodedSeconds?: number
  activePlaylistID: string
  activeThemeID: string
  previousVideoExists: boolean
  appVersion: string
} & BaseStreamInfo

export type SocketClient = {
  socket: Socket
  username: string
  role: AuthRole
  image: string
  isWatching: boolean
}

export type Viewer = {
  socketID: string
  username: string
  image: string
  role: AuthRole
}

export type ChatMessage =
  | {
      type: ChatType.UserChat
      username: string
      role: AuthRole
      image: string
      message: string
    }
  | {
      type: Exclude<ChatType, ChatType.UserChat>
      message: string
    }

export type AuthenticatePayload = {
  username: string
  password: string
}

export type EditPlaylistNamePayload = {
  playlistID: string
  newName: string
}

export type EditPlaylistVideosPayload = {
  playlistID: string
  // newVideoPaths: string[]
  newVideoPaths: number[]
}

export type ClientPlaylist = {
  id: string
  name: string
  videoPaths: number[]
}

export type ClientVideo = {
  id: string
  jobID: string
  state: VideoState
  name: string
  isBumper: boolean
  path: string
  thumbnailURL: string
  isPlaying: boolean
  error?: string
}

export type ClientBumper = {
  name: string
  path: string
}

export type TranscodeClientVideo = {
  id: string
  state: JobState
  name: string
  inputPath: string
  thumbnailURL: string
  isUsingCache: boolean
  targetSection: string
  totalSeconds: number
  availableSeconds: number
  averageFpsRate: number
  currentFpsRate?: number
  frames: number
  error?: string
}

export type ClientHistoryItem = {
  name: string
  totalDuration: string
  thumbnailURL: string
  isBumper: boolean
}

export type ClientHistoryStatus = {
  currentCount: number
  totalCount: number
  isDeleting: boolean
}

export type ClientCacheStatus = {
  cacheID: CacheID
  fileCount: number
  videosCount?: number
  size: string
  isDeleting: boolean
}
