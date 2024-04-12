import type { AuthRole } from '@/lib/enums'
import type { Socket } from 'socket.io'
import { StreamState } from '@/lib/enums'
import path from 'path';

export type StreamPlaying = {
  state: StreamState.Playing,
  id: string,
  name: string,
  path: string,
  currentSeconds: number,
  totalSeconds: number
}

export type StreamPaused = {
  state: StreamState.Paused,
  id: string,
  name: string,
  path: string,
  currentSeconds: number,
  totalSeconds: number
}

export type StreamLoading = {
  state: StreamState.Loading,
}

export type StreamError = {
  state: StreamState.Error,
  error: string
}

export type StreamInfo =
  | StreamPlaying
  | StreamPaused
  | StreamLoading
  | StreamError

export type Client = {
  socket: Socket
  secret: string,
  username: string,
  role: AuthRole
}

export type Viewer = {
  socketID: string,
  username: string,
  role: AuthRole
}

export type ChatMessage = {
  username: string,
  role: AuthRole,
  message: string
}

export type JoinStreamPayload = {
  username: string,
  secret: string,
  password: string
}

export type EditPlaylistNamePayload = {
  playlistID: string,
  newName: string
}

export type EditPlaylistVideosPayload = {
  playlistID: string,
  newVideoPaths: string[]
}

export type TranscodeClientVideo = {
  name: string,
  inputPath: string,
  isTranscoding: boolean,
  progressPercentage: number
}