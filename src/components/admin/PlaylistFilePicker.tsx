'use client'

import { useState, useContext, createContext, useEffect, useMemo } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './PlaylistFilePicker.module.scss'
import type { ClientPlaylist, FileTree } from '@/typings/types'
import type { EditPlaylistVideosPayload } from '@/typings/socket'

// Stream page context
type ContextProps = {
  playlist: ClientPlaylist,
  tree: FileTree,
  allPaths: string[],
  pathMap: Map<string, number>,
  activePaths: string[],
  setActivePaths: (paths: string[]) => void,
  openFolders: string[],
  setOpenFolders: (folders: string[]) => void,
  selectFolder: (folderPath: string) => void,
  deselectFolder: (folderPath: string) => void,
  selectFile: (filePath: string) => void,
  deselectFile: (filePath: string) => void
}

// Context provider wrapper component
function PlaylistFilePickerProvider({ playlist, children }: { playlist: ClientPlaylist, children: React.ReactNode }) {
  const { fileTree: tree } = useAdminContext()
  if (!tree) return null

  const { socket } = useStreamContext()

  const [activePaths, setActivePaths] = useState<string[]>(playlist.videoPaths)
  const [openFolders, setOpenFolders] = useState<string[]>([tree.path])

  // Select all children of a folder
  function selectFolder(folderPath: string) {
    const children = allPaths.filter(path => path.startsWith(folderPath + '/'))
    setActivePaths([...activePaths, ...children])
  }

  // Deselect all children of a folder
  function deselectFolder(folderPath: string) {
    setActivePaths(activePaths.filter(path => !path.startsWith(folderPath + '/')))
  }

  // Select specific file path
  function selectFile(filePath: string) {
    setActivePaths([...activePaths, filePath])
  }

  // Deselect specific file path
  function deselectFile(filePath: string) {
    const index = activePaths.indexOf(filePath)
    if (index === -1) return
    setActivePaths([...activePaths.slice(0, index), ...activePaths.slice(index + 1)])
  }

  // Update playlist video paths when activePaths change
  useEffect(() => {
    if (activePaths === playlist.videoPaths) return
    // const deletedPaths = playlist.videoPaths.filter(path => !activePaths.includes(path))
    // const newPaths = activePaths.filter(path => !playlist.videoPaths.includes(path))
    const pathsIndex: number[] = []
    for (const path of activePaths) {
      const index = pathMap.get(path)
      if (index !== undefined) pathsIndex.push(index)
    }
    socket.emit(Msg.AdminEditPlaylistVideos, {
      playlistID: playlist.id,
      // newVideoPaths: activePaths
      newVideoPaths: pathsIndex
    } satisfies EditPlaylistVideosPayload)
  }, [activePaths])

  const allPaths = useMemo(() => {
    const allPaths: string[] = []
    function getPaths(item: FileTree) {
      if (!item.isDirectory) allPaths.push(item.path)
      else if (item.children) for (const child of item.children) { getPaths(child) }
    }
    getPaths(tree)
    return allPaths
  }, [tree])
  // const allPaths: string[] = []
  // function getPaths(item: FileTree) {
  //   if (!item.isDirectory) allPaths.push(item.path)
  //   else if (item.children) for (const child of item.children) { getPaths(child) }
  // }
  // getPaths(tree)

  const pathMap = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < allPaths.length; i++) {
      map.set(allPaths[i], i)
    }
    return map
  }, [tree])

  const context: ContextProps = {
    playlist,
    tree,
    allPaths,
    pathMap,
    activePaths, setActivePaths,
    openFolders, setOpenFolders,
    selectFolder,
    deselectFolder,
    selectFile,
    deselectFile
  }

  return <PlaylistFilePickerContext.Provider value={context}>{children}</PlaylistFilePickerContext.Provider>
}

// Create the context and custom hook for it
const PlaylistFilePickerContext = createContext<ContextProps>(null as any)
const usePlaylistFilePickerContext = () => useContext(PlaylistFilePickerContext)


export default function PlaylistFilePicker({ playlist }: { playlist: ClientPlaylist }) {
  return (
    <div className={styles.filePicker}>
      <PlaylistFilePickerProvider playlist={playlist}>
        <Root />
      </PlaylistFilePickerProvider>
    </div>
  )
}

function Root() {
  const { tree, playlist } = usePlaylistFilePickerContext()
  return <TreeFolder item={tree} depth={0} />
}

type TreeFolderProps = {
  item: FileTree,
  depth: number
}

function TreeFolder({ item, depth }: TreeFolderProps) {
  const { openFolders, setOpenFolders, allPaths, activePaths, selectFolder, deselectFolder } = usePlaylistFilePickerContext()

  const childrenCount = useMemo(() => {
    return allPaths.filter(path => path.startsWith(item.path + '/')).length
  }, [allPaths])

  const [isActive, activeChildrenPaths] = useMemo(() => {
    // return childrenPaths.every(path => activePaths.includes(path))
    // let count = 0
    // for (const path of activePaths) {
    //   if (!path.startsWith(item.path + '/')) continue
    //   count++
    //   if (count === childrenCount) return true
    // }
    // return false
    const activeChildrenPaths: string[] = []
    for (const path of activePaths) {
      if (!path.startsWith(item.path + '/')) continue
      activeChildrenPaths.push(path)
      if (activeChildrenPaths.length === childrenCount) return [true, activeChildrenPaths]
    }
    return [false, activeChildrenPaths]
  }, [activePaths])

  const isFolderOpen = useMemo(() => {
    return openFolders.includes(item.path)
  }, [openFolders])

  function toggleActive() {
    if (isActive) deselectFolder(item.path)
    else selectFolder(item.path) 
  }

  function toggleOpen() {
    if (openFolders.includes(item.path)) setOpenFolders(openFolders.filter(path => path !== item.path))
    else setOpenFolders([...openFolders, item.path])
  }

  return (
    <div className={isActive ? `${styles.treeItem} ${styles.selected}` : styles.treeItem} style={depth === 0 ? undefined : { marginLeft: `1rem` }}>
      <div className={isActive ? `${styles.item} ${styles.selected}` : styles.item} onClick={toggleOpen}>
        <input type="checkbox" checked={isActive} onChange={toggleActive} onClick={event => event.stopPropagation()} />
        <Icon name={isFolderOpen ? 'folder-open' : 'folder'} />
        <span title={item.name}>{item.name}</span>
      </div>
      {isFolderOpen && item.children && item.children.map(child => {
        if (child.isDirectory) return <TreeFolder key={child.path} item={child} depth={depth + 1} />

        const isFileActive = isActive || activeChildrenPaths.includes(child.path)
        return <TreeFile key={child.path} item={child} depth={depth + 1} isActive={isFileActive} />
      })}
    </div>
  )
}

type TreeFileProps = {
  item: FileTree,
  depth: number,
  isActive: boolean
}

function TreeFile({ item, depth, isActive }: TreeFileProps) {
  const { selectFile, deselectFile } = usePlaylistFilePickerContext()

  function toggleActive() {
    if (isActive) deselectFile(item.path)
    else selectFile(item.path)
  }

  return (
    <div className={isActive ? `${styles.treeItem} ${styles.selected}` : styles.treeItem} style={depth === 0 ? undefined : { marginLeft: `1rem` }}>
      <label className={isActive ? `${styles.item} ${styles.selected}` : styles.item}>
        <input type="checkbox" checked={isActive} onChange={toggleActive} />
        <Icon name="video-file" />
        <span title={item.name}>{item.name}</span>
      </label>
    </div>
  )
}