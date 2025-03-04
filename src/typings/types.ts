import { AuthRole, VideoState } from '@/shared/enums'
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
  averageFpsRate: number
  currentFpsRate: number
  frames: number
}

export type FileTreeBase = {
  rootPath: string
  rootNode: FileTreeNode
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

export type ListOption = {
  list: {
    name: string
    id: string
  }[]
  selectedID: string
}

export type MultiListOption = {
  list: {
    name: string
    id: string
  }[]
  selectedIDs: string[]
}

export type ScheduleEntryOptions = {
  isEnabled: boolean
  day: number
  hours: number
  minutes: number
  playlistID: string
}
