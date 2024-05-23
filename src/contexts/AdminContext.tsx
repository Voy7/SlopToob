'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { sections, type SectionName } from '@/components/admin/AdminModal'
import { useStreamContext } from './StreamContext'
import { Msg } from '@/lib/enums'
import { ClientBumper, ClientPlaylist, ClientVideo, FileTree } from '@/typings/types'
import { TranscodeClientVideo } from '@/typings/socket'
import useSocketOn from '@/hooks/useSocketOn'

// Stream page context
type ContextProps = {
  section: typeof sections[number],
  setSection: (sectionName: SectionName) => void,
  fileTree: FileTree | null,
  playlists: ClientPlaylist[],
  selectedPlaylist: string | null,
  setSelectedPlaylist: (id: string | null) => void,
  bumpers: ClientBumper[],
  queue: ClientVideo[],
  transcodeQueue: TranscodeClientVideo[]
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useStreamContext()

  const [section, setSectionState] = useState<typeof sections[number]>(sections[0])
  const [fileTree, setFileTree] = useState<FileTree | null>(null)
  const [playlists, setPlaylists] = useState<ClientPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [bumpers, setBumpers] = useState<ClientBumper[]>([])
  const [queue, setQueue] = useState<ClientVideo[]>([])
  const [transcodeQueue, setTranscodeQueue] = useState<TranscodeClientVideo[]>([])

  function setSection(sectionName: SectionName) {
    const sec = sections.find(s => s.name === sectionName)
    if (sec) setSectionState(sec)
  }

  // Request data from server, expect a bunch of socket messages
  useEffect(() => {
    socket.emit(Msg.AdminRequestAllData)
  }, [])

  useSocketOn(Msg.AdminFileTree, (tree: FileTree) => setFileTree(tree))
  useSocketOn(Msg.AdminPlaylists, (playlists: ClientPlaylist[]) => setPlaylists(playlists))
  useSocketOn(Msg.AdminBumpersList, (bumpers: ClientBumper[]) => setBumpers(bumpers))
  useSocketOn(Msg.AdminQueueList, (queue: ClientVideo[]) => setQueue(queue))
  useSocketOn(Msg.AdminTranscodeQueueList, (queue: TranscodeClientVideo[]) => setTranscodeQueue(queue))

  useEffect(() => {
    const isPlaylistSelected = playlists.some(playlist => playlist.id === selectedPlaylist)
    if (!isPlaylistSelected && playlists[0]) setSelectedPlaylist(playlists[0].id)
  }, [selectedPlaylist, playlists])

  const context: ContextProps = {
    section,
    setSection,
    fileTree,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    bumpers,
    queue,
    transcodeQueue
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)