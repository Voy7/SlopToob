'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { sections, type SectionName } from '@/components/admin/AdminModal'
import { useStreamContext } from './StreamContext'
import { Msg } from '@/lib/enums'
import { ClientBumper, ClientPlaylist, ClientVideo, FileTreeNode } from '@/typings/types'
import { ClientCacheStatus, ClientHistoryStatus, TranscodeClientVideo } from '@/typings/socket'
import useSocketOn from '@/hooks/useSocketOn'

// Stream page context
type ContextProps = {
  section: (typeof sections)[number]
  setSection: (sectionName: SectionName) => void
  fileTree: FileTreeNode | null
  playlists: ClientPlaylist[]
  setPlaylists: React.Dispatch<React.SetStateAction<ClientPlaylist[]>>
  selectedPlaylist: string | null
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<string | null>>
  lastReceivedPlaylistsDate: number
  bumpers: ClientBumper[]
  queue: ClientVideo[]
  transcodeQueue: TranscodeClientVideo[]
  historyStatus: ClientHistoryStatus | null
  videosCacheStatus: ClientCacheStatus | null
  bumpersCacheStatus: ClientCacheStatus | null
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useStreamContext()

  const [section, setSectionState] = useState<(typeof sections)[number]>(sections[0])
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

  function setSection(sectionName: SectionName) {
    const sec = sections.find((s) => s.name === sectionName)
    if (sec) setSectionState(sec)
  }

  // Request data from server, expect a bunch of socket messages
  useEffect(() => {
    socket.emit(Msg.AdminRequestAllData)
  }, [])

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
  useSocketOn(Msg.AdminVideosCacheStatus, (status: ClientCacheStatus) =>
    setVideosCacheStatus(status)
  )
  useSocketOn(Msg.AdminBumpersCacheStatus, (status: ClientCacheStatus) =>
    setBumpersCacheStatus(status)
  )

  useEffect(() => {
    const isPlaylistSelected = playlists.some((playlist) => playlist.id === selectedPlaylist)
    if (!isPlaylistSelected && playlists[0]) setSelectedPlaylist(playlists[0].id)
  }, [selectedPlaylist, playlists])

  const context: ContextProps = {
    section,
    setSection,
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
    bumpersCacheStatus
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)
