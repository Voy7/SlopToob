import { AuthRole, VideoState } from '@/lib/enums'
import type { Playlist } from '@prisma/client'

export type AuthUser = {
  password: string,
  role: AuthRole,
}

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
  videos: string[]
} & Omit<Playlist, 'videoPaths'>

export type ClientPlaylist = {
  id: string,
  name: string,
  videoPaths: string[]
}

export type ClientVideo = {
  id: string,
  state: VideoState
  name: string,
  path: string
}

export type ClientBumper = {
  name: string,
  path: string
}

// export type ListOption0 = {
//   name: string,
//   id: string
// }

export type ListOption = {
  list: {
    name: string,
    id: string
  }[],
  selectedID: string
}