export type ActionResponse = { error: string } | { success: boolean }

import { AuthRole } from '@/lib/enums'

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