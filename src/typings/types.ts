import { AuthRole } from '@/lib/enums'
import type { Playlist, Video } from '@prisma/client'
import path from 'path';

export type ActionResponse = { error: string } | { success: boolean }

export type AuthUser = {
  password: string,
  role: AuthRole,
}

// export type VideoInfo = {
//   title: string,
//   show?: string,
//   season?: number,
//   episode?: number
// }

// export type QueueItem = {
//   id: string,
//   isReady: boolean,
//   info: VideoInfo,
//   error?: string
// }

export type StreamState = {
  playingID: string | null,
  timeSeconds: number,
  isPaused: boolean,
  canSkip: boolean
}

export type ChangeUsernamePayload = {
  username: string,
  socketID: string
}

export type FileTree = {
  isDirectory: boolean,
  name: string,
  path: string,
  children?: FileTree[]
}

export type RichPlaylist = {
  videos: Video[]
} & Playlist

export type ClientPlaylist = {
  id: string,
  name: string,
  videoPaths: string[]
}

export type ClientVideo = {
  path: string,
  name: string
}