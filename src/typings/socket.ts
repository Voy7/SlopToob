import type { AuthRole, JobState } from '@/lib/enums'
import type { Socket } from 'socket.io'
import { StreamState, ChatType } from '@/lib/enums'

export type StreamPlaying = {
  state: StreamState.Playing,
  id: string,
  name: string,
  path: string,
  isBumper: boolean,
  currentSeconds: number,
  totalSeconds: number
}

export type StreamPaused = {
  state: StreamState.Paused,
  id: string,
  name: string,
  path: string,
  isBumper: boolean,
  currentSeconds: number,
  totalSeconds: number
}

export type StreamLoading = {
  state: StreamState.Loading,
  name: string
}

export type StreamError = {
  state: StreamState.Error,
  name?: string,
  error: string
}

export type StreamOptions = {
  version: string,
  streamTheme: string,
  history: ClientHistoryItem[] | null,
  chat: {
    showTimestamps: boolean,
    showIdenticons: boolean
  }
  voteSkip: {
    isEnabled: boolean,
    isAllowed: boolean,
    allowedInSeconds: number,
    currentCount: number,
    requiredCount: number
  }
}

export type StreamInfo = (
  | StreamPlaying
  | StreamPaused
  | StreamLoading
  | StreamError
) & StreamOptions

export type SocketClient = {
  socket: Socket
  username: string,
  image: string,
  role: AuthRole
}

export type Viewer = {
  socketID: string,
  username: string,
  image: string,
  role: AuthRole
}

export type ChatMessage = {
  type: ChatType.UserChat,
  username: string,
  role: AuthRole,
  image: string,
  message: string
} | {
  type: Exclude<ChatType, ChatType.UserChat>,
  message: string
}

export type JoinStreamPayload = {
  username: string,
  password: string
}

export type EditPlaylistNamePayload = {
  playlistID: string,
  newName: string
}

export type EditPlaylistVideosPayload = {
  playlistID: string,
  // newVideoPaths: string[]
  newVideoPaths: number[]
}

export type TranscodeClientVideo = {
  id: string,
  state: JobState,
  name: string,
  inputPath: string,
  progressPercentage: number
}

export type ClientHistoryItem = {
  name: string,
  totalDuration: string,
  thumbnailURL: string,
  isBumper: boolean,
}

export type ClientHistoryStatus = {
  currentCount: number,
  totalCount: number,
  isDeleting: boolean
}

export type ClientCacheStatus = {
  filesCount: number,
  size: string,
  isDeleting: boolean
}