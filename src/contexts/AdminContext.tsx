'use client'

import { useState, useContext, createContext, useEffect } from 'react'
import { sections, type SectionName } from '@/components/admin/AdminModal'
import { useStreamContext } from './StreamContext'
import { SocketEvent } from '@/lib/enums'
import { ClientPlaylist, FileTree } from '@/typings/types'

// Stream page context
type ContextProps = {
  section: typeof sections[number],
  setSection: (sectionName: SectionName) => void,
  fileTree: FileTree | null,
  playlists: ClientPlaylist[],
  selectedPlaylist: string | null,
  setSelectedPlaylist: (id: string | null) => void,
}

type Props =  {
  // authUser: AuthUser,
  // cookieUsername: string,
  children: React.ReactNode
}

// Context provider wrapper component
export function AdminProvider({ children }:Props) {
  const { socket } = useStreamContext()

  if (!socket) return null

  const [section, setSectionState] = useState<typeof sections[number]>(sections[0])
  const [fileTree, setFileTree] = useState<FileTree | null>(null)
  const [playlists, setPlaylists] = useState<ClientPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

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
  }, [])

  useEffect(() => {
    if (!selectedPlaylist && playlists[0]) setSelectedPlaylist(playlists[0].id)
  }, [playlists])

  const context: ContextProps = {
    section,
    setSection,
    fileTree,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
  }

  return <AdminContext.Provider value={context}>{children}</AdminContext.Provider>
}

// Create the context and custom hook for it
export const AdminContext = createContext<ContextProps>(null as any)
export const useAdminContext = () => useContext(AdminContext)