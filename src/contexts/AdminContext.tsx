'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import { Msg } from '@/lib/enums'
import type { ClientBumper, ClientPlaylist, ClientVideo, FileTreeNode } from '@/typings/types'
import type {
  AdminStreamInfo,
  ClientCacheStatus,
  ClientHistoryStatus,
  TranscodeClientVideo
} from '@/typings/socket'
import type { IconNames } from '@/components/ui/Icon'
import SectionStream from '@/components/admin/SectionStream'
import SectionPlaylists from '@/components/admin/SectionPlaylists'
import SectionBumpers from '@/components/admin/SectionBumpers'
import SectionCaching from '@/components/admin/SectionCaching'
import SectionChat from '@/components/admin/SectionChat'
import SectionHistory from '@/components/admin/SectionHistory'
import SectionVoteSkip from '@/components/admin/SectionVoteSkip'
import SectionDebug from '@/components/admin/SectionDebug'
import SectionAdvanced from '@/components/admin/SectionAdvanced'

type Section = {
  name: string
  icon: IconNames
  category: number
  component: React.ReactNode
}

// Admin panel sections
export const sections = [
  {
    name: 'Overview',
    icon: 'stream-settings',
    category: 1,
    component: <SectionStream />
  },
  {
    name: 'Playlists',
    icon: 'playlist',
    category: 1,
    component: <SectionPlaylists />
  },
  {
    name: 'Bumpers',
    icon: 'bumper',
    category: 1,
    component: <SectionBumpers />
  },
  {
    name: 'Caching',
    icon: 'cache',
    category: 1,
    component: <SectionCaching />
  },
  { name: 'Chat', icon: 'chat', category: 2, component: <SectionChat /> },
  {
    name: 'History',
    icon: 'history',
    category: 2,
    component: <SectionHistory />
  },
  {
    name: 'Vote Skip',
    icon: 'skip',
    category: 2,
    component: <SectionVoteSkip />
  },
  {
    name: 'Debug',
    icon: 'admin-panel',
    category: 3,
    component: <SectionDebug />
  },
  {
    name: 'Advanced',
    icon: 'settings',
    category: 3,
    component: <SectionAdvanced />
  }
] as const satisfies Section[]

export type SectionName = (typeof sections)[number]['name']

// Stream page context
type ContextProps = {
  section: (typeof sections)[number]
  setSection: (sectionName: SectionName) => void
  streamInfo: AdminStreamInfo
  lastStreamUpdateTimestamp: number | null
  fileTree: FileTreeNode | null
  playlists: ClientPlaylist[]
  setPlaylists: React.Dispatch<React.SetStateAction<ClientPlaylist[]>>
  selectedPlaylist: string | null
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<string | null>>
  lastReceivedPlaylistsDate: number
  bumpers: ClientBumper[]
  queue: ClientVideo[]
  transcodeQueue: TranscodeClientVideo[]
  historyStatus: ClientHistoryStatus
  videosCacheStatus: ClientCacheStatus
  bumpersCacheStatus: ClientCacheStatus
  thumbnailsCacheStatus: ClientCacheStatus
  logs: string[]
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext()

  const [section, setSectionState] = useState<(typeof sections)[number]>(sections[0])
  const [streamInfo, setStreamInfo] = useState<AdminStreamInfo | null>(null)
  const [lastStreamUpdateTimestamp, setLastStreamUpdateTimestamp] = useState<number | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null)
  const [playlists, setPlaylists] = useState<ClientPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [lastReceivedPlaylistsDate, setLastReceivedPlaylistsDate] = useState<number>(0)
  const [bumpers, setBumpers] = useState<ClientBumper[]>([])
  const [queue, setQueue] = useState<ClientVideo[]>([])
  const [transcodeQueue, setTranscodeQueue] = useState<TranscodeClientVideo[]>([])
  const [historyStatus, setHistoryStatus] = useState<ClientHistoryStatus | null>(null)
  const [videosCacheStatus, setVideosCacheStatus] = useState<ClientCacheStatus | null>(null)
  const [bumpersCacheStatus, setBumpersCacheStatus] = useState<ClientCacheStatus | null>(null)
  const [thumbnailsCacheStatus, setThumbnailsCacheStatus] = useState<ClientCacheStatus | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  function setSection(sectionName: SectionName) {
    const sec = sections.find((s) => s.name === sectionName)
    if (sec) setSectionState(sec)
  }

  // Request data from server, expect a bunch of socket messages
  useEffect(() => {
    socket.emit(Msg.AdminRequestAllData)
  }, [])

  useSocketOn(Msg.AdminStreamInfo, (info: AdminStreamInfo) => {
    setStreamInfo(info)
    setLastStreamUpdateTimestamp(Date.now())
  })
  useSocketOn(Msg.AdminFileTree, (tree: FileTreeNode) => setFileTree(tree))
  useSocketOn(Msg.AdminPlaylists, (playlists: ClientPlaylist[]) => {
    setPlaylists(playlists)
    setLastReceivedPlaylistsDate(Date.now())
  })
  useSocketOn(Msg.AdminBumpersList, (bumpers: ClientBumper[]) => setBumpers(bumpers))
  useSocketOn(Msg.AdminQueueList, (queue: ClientVideo[]) => setQueue(queue))
  useSocketOn(Msg.AdminTranscodeQueueList, (queue: TranscodeClientVideo[]) =>
    setTranscodeQueue(queue)
  )
  useSocketOn(Msg.AdminHistoryStatus, (status: ClientHistoryStatus) => setHistoryStatus(status))
  useSocketOn(Msg.AdminCacheStatus, (status: ClientCacheStatus) => {
    if (status.cacheID === 'videos') setVideosCacheStatus(status)
    if (status.cacheID === 'bumpers') setBumpersCacheStatus(status)
    if (status.cacheID === 'thumbnails') setThumbnailsCacheStatus(status)
  })

  useSocketOn(Msg.AdminSendAllLogs, (logs: string[]) => setLogs(logs))

  useSocketOn(Msg.AdminNewLog, (log: string) => {
    setLogs((prev) => {
      if (prev.length >= 500) prev.shift()
      return [...prev, log]
    })
  })

  useEffect(() => {
    const isPlaylistSelected = playlists.some((playlist) => playlist.id === selectedPlaylist)
    if (!isPlaylistSelected && playlists[0]) setSelectedPlaylist(playlists[0].id)
  }, [selectedPlaylist, playlists])

  // TODO: Add meaningful loading state
  if (!streamInfo) return null
  if (!historyStatus) return null
  if (!videosCacheStatus) return null
  if (!bumpersCacheStatus) return null
  if (!thumbnailsCacheStatus) return null

  const context: ContextProps = {
    section,
    setSection,
    streamInfo,
    lastStreamUpdateTimestamp,
    fileTree,
    playlists,
    setPlaylists,
    selectedPlaylist,
    setSelectedPlaylist,
    lastReceivedPlaylistsDate,
    bumpers,
    queue,
    transcodeQueue,
    historyStatus,
    videosCacheStatus,
    bumpersCacheStatus,
    thumbnailsCacheStatus,
    logs
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)
