'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useListOption } from '@/components/admin/common/ListOption'
import { useMultiListOption } from '@/components/admin/common/MultiListOption'
import useSocketOn from '@/hooks/useSocketOn'
import { Msg } from '@/shared/enums'
import LoadingPage from '@/components/layout/LoadingPage'
import { adminSections, type AdminSectionID } from '@/app/admin/adminSections'
import type { FileTreeBase, ListOption, MultiListOption } from '@/typings/types'
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

// Stream page context
type ContextProps = {
  section: (typeof adminSections)[number]
  setSection: (sectionName: AdminSectionID) => void
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
  activePlaylist: {
    value: ListOption
    setValue: (id: string) => void
  }
  activeThemes: {
    value: MultiListOption
    toggle: (id: string) => void
  }
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext()

  const [section, setSectionState] = useState<(typeof adminSections)[number]>(adminSections[0])
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

  const activePlaylist = useListOption('activePlaylistID')
  const activeThemes = useMultiListOption('activeThemes')

  function setSection(sectionID: AdminSectionID) {
    const sec = adminSections.find((s) => s.id === sectionID)
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

  if (!streamInfo) return <LoadingPage text="Fetching admin info - Stream Info" />
  if (!historyStatus) return <LoadingPage text="Fetching admin info - History Status" />
  if (!videosCacheStatus) return <LoadingPage text="Fetching admin info - Videos Cache Status" />
  if (!bumpersCacheStatus) return <LoadingPage text="Fetching admin info - Bumpers Cache Status" />
  if (!thumbnailsCacheStatus)
    return <LoadingPage text="Fetching admin info - Thumbnails Cache Status" />
  if (!schedule) return <LoadingPage text="Fetching admin info - Schedule" />
  if (!richUsers) return <LoadingPage text="Fetching admin info - Rich Users" />
  if (!activePlaylist.value) return <LoadingPage text="Fetching admin info - Active Playlist" />
  if (!activeThemes.value) return <LoadingPage text="Fetching admin info - Active Themes" />

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
    logs,
    // @ts-ignore, activePlaylist.value is checked above, no clue why TS is complaining
    activePlaylist,
    // @ts-ignore, activeThemes.value is checked above, no clue why TS is complaining
    activeThemes
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)
