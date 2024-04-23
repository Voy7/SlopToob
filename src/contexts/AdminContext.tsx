'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { sections, type SectionName } from '@/components/admin/AdminModal'
import { useStreamContext } from './StreamContext'
import { SocketEvent } from '@/lib/enums'
import { ClientPlaylist, ClientVideo, FileTree } from '@/typings/types'
import { TranscodeClientVideo } from '@/typings/socket'

// Stream page context
type ContextProps = {
  section: typeof sections[number],
  setSection: (sectionName: SectionName) => void,
  fileTree: FileTree | null,
  playlists: ClientPlaylist[],
  selectedPlaylist: string | null,
  setSelectedPlaylist: (id: string | null) => void,
  bumpers: string[],
  queue: ClientVideo[],
  transcodeQueue: TranscodeClientVideo[]
}

// Context provider wrapper component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useStreamContext()

  // if (!socket) return null

  const [section, setSectionState] = useState<typeof sections[number]>(sections[0])
  const [fileTree, setFileTree] = useState<FileTree | null>(null)
  const [playlists, setPlaylists] = useState<ClientPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [bumpers, setBumpers] = useState<string[]>([])
  const [queue, setQueue] = useState<ClientVideo[]>([])
  const [transcodeQueue, setTranscodeQueue] = useState<TranscodeClientVideo[]>([])

  function setSection(sectionName: SectionName) {
    const sec = sections.find(s => s.name === sectionName)
    if (sec) setSectionState(sec)
  }

  useEffect(() => {
    // Request data from server, expect a bunch of socket messages
    socket.emit(SocketEvent.AdminRequestAllData)

    socket.on(SocketEvent.AdminRequestFileTree, (tree: FileTree) => {
      console.log('File tree:', tree)
      setFileTree(tree)
    })


    socket.on(SocketEvent.AdminRequestPlaylists, (playlists: ClientPlaylist[]) => {
      console.log('Playlists:', selectedPlaylist, playlists)
      setPlaylists(playlists)
      // if (!selectedPlaylist && playlists[0]) setSelectedPlaylist(playlists[0].id)
    })

    socket.on(SocketEvent.AdminBumpersList, (bumpers: string[]) => {
      console.log('Bumpers:', bumpers)
      setBumpers(bumpers)
    })

    socket.on(SocketEvent.AdminQueueList, (queue: ClientVideo[]) => {
      console.log('Queue:', queue)
      setQueue(queue)
    })

    socket.on(SocketEvent.AdminTranscodeQueueList, (queue: TranscodeClientVideo[]) => {
      console.log('Transcode queue:', queue)
      setTranscodeQueue(queue)
    })
  }, [])

  useEffect(() => {
    if (!selectedPlaylist && playlists[0]) setSelectedPlaylist(playlists[0].id)
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