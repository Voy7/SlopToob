import type { AuthRole } from '@/lib/enums'
import type { Socket } from 'socket.io'
import { PlayerState } from '@/lib/enums'
import path from 'path';

export type StreamPlaying = {
  state: PlayerState.Playing,
  id: string,
  name: string,
  path: string,
  currentSeconds: number,
  totalSeconds: number
}

export type StreamLoading = {
  state: PlayerState.Loading,
}

export type StreamError = {
  state: PlayerState.Error,
  error: string
}

export type StreamInfo =
  | StreamPlaying
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