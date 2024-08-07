import { AuthRole, VideoState } from '@/lib/enums'
import type { Playlist } from '@prisma/client'

export type AuthUser = {
  password: string
  role: AuthRole
}

export type ProgressInfo = {
  percent: number
  processedSeconds: number
  processedTimestamp: string
  availableSeconds: number
  availableTimestamp: string
  fpsRate: number
  frames: number
}

export type FileTreeNode = {
  name: string
  path: string
  children?: FileTreeNode[]
}

export type RichPlaylist = {
  videos: string[]
  videoIndexes: number[]
} & Omit<Playlist, 'videoPaths'>

export type ClientPlaylist = {
  id: string
  name: string
  videoPaths: number[]
}

export type ClientVideo = {
  id: string
  state: VideoState
  name: string
  path: string
}

export type ClientBumper = {
  name: string
  path: string
}

export type ListOption = {
  list: {
    name: string
    id: string
  }[]
  selectedID: string
}
