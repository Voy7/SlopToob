'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useSocketOn from '@/hooks/useSocketOn'
import { Msg } from '@/lib/enums'
import SectionOverview from '@/components/admin/sections/SectionOverview'
import SectionPlaylists from '@/components/admin/sections/SectionPlaylists'
import SectionBumpers from '@/components/admin/sections/SectionBumpers'
import SectionSchedule from '@/components/admin/sections/SectionSchedule'
import SectionCaching from '@/components/admin/sections/SectionCaching'
import SectionDebug from '@/components/admin/sections/SectionDebug'
import SectionSettings from '@/components/admin/sections/SectionSettings'
import type { FileTreeBase } from '@/typings/types'
import type {
  AdminStreamInfo,
  ClientBumper,
  ClientPlaylist,
  ClientVideo,
  ClientCacheStatus,
  ClientHistoryStatus,
  TranscodeClientVideo,
  ClientScheduleEntry,
  ClientSchedule,
  ClientRichUser
} from '@/typings/socket'
import type { IconNames } from '@/components/ui/Icon'

type Section = {
  id: string
  name: string
  icon: IconNames
  accentColor: string
  component: React.ReactNode
}

// Admin panel sections
export const sections = [
  {
    id: 'overview',
    name: 'Overview',
    icon: 'stream-settings',
    accentColor: 'bg-gray-500',
    component: <SectionOverview />
  },
  {
    id: 'playlists',
    name: 'Playlists',
    icon: 'playlist',
    accentColor: 'bg-blue-500',
    component: <SectionPlaylists />
  },
  {
    id: 'bumpers',
    name: 'Bumpers',
    icon: 'bumper',
    accentColor: 'bg-blue-700',
    component: <SectionBumpers />
  },
  {
    id: 'schedule',
    name: 'Schedule',
    icon: 'calendar',
    accentColor: 'bg-yellow-500',
    component: <SectionSchedule />
  },
  {
    id: 'caching',
    name: 'Caching',
    icon: 'cache',
    accentColor: 'bg-purple-700',
    component: <SectionCaching />
  },
  {
    id: 'debug',
    name: 'Debug',
    accentColor: 'bg-red-500',
    icon: 'admin-panel',
    component: <SectionDebug />
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    accentColor: 'bg-red-500',
    component: <SectionSettings />
  }
] as const satisfies Section[]

export type SectionID = (typeof sections)[number]['id']

// Stream page context
type ContextProps = {
  section: (typeof sections)[number]
  setSection: (sectionName: SectionID) => void
  settingsSubSection: string
  setSettingsSubSection: React.Dispatch<React.SetStateAction<string>>
  streamInfo: AdminStreamInfo
  lastStreamUpdateTimestamp: number | null
  fileTree: FileTreeBase | null
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
  schedule: ClientSchedule
  richUsers: ClientRichUser[]
  logs: string[]
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext()

  const [section, setSectionState] = useState<(typeof sections)[number]>(sections[0])
  const [settingsSubSection, setSettingsSubSection] = useState<string>('transcoding')
  const [streamInfo, setStreamInfo] = useState<AdminStreamInfo | null>(null)
  const [lastStreamUpdateTimestamp, setLastStreamUpdateTimestamp] = useState<number | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeBase | null>(null)
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
  const [schedule, setSchedule] = useState<ClientSchedule | null>(null)
  const [richUsers, setRichUsers] = useState<ClientRichUser[] | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  function setSection(sectionID: SectionID) {
    const sec = sections.find((s) => s.id === sectionID)
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
  useSocketOn(Msg.AdminFileTree, (tree: FileTreeBase) => setFileTree(tree))
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
  useSocketOn(Msg.AdminSchedule, (schedule: ClientSchedule) => setSchedule(schedule))
  useSocketOn(Msg.AdminRichUsers, (users: ClientRichUser[]) => setRichUsers(users))
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
  if (!schedule) return null
  if (!richUsers) return null

  const context: ContextProps = {
    section,
    setSection,
    settingsSubSection,
    setSettingsSubSection,
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
    schedule,
    richUsers,
    logs
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)
