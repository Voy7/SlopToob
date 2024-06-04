'use client'

import { useState, useContext, createContext, useEffect, useMemo } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import styles from './PlaylistFilePicker.module.scss'
import type { ClientPlaylist, FileTree } from '@/typings/types'
import type { EditPlaylistVideosPayload } from '@/typings/socket'

type TreeNode = {
  path: string,
  name: string,
  active: boolean,
  parent?: TreeNode,
  children?: TreeNode[]
}

// Stream page context
type ContextProps = {
  playlist: ClientPlaylist,
  tree: FileTree,
  activeMap: Map<string, TreeNode>,
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

  const [activeMap, setActiveMap] = useState<Map<string, TreeNode>>(new Map())

  // Create map of all paths and if they're active (if they're in playlist.videoPaths)
  useEffect(() => {
    const map = new Map<string, TreeNode>()
    function getPaths(item: FileTree, parentNode?: TreeNode): TreeNode {
      if (item.children) {
        const parent: TreeNode = {
          path: item.path,
          name: item.name,
          active: false,
          children: []
        }
        if (parentNode) parent.parent = parentNode
        for (const child of item.children) {
          const childNode = getPaths(child, parent)
          if (!childNode) continue
          parent.children?.push(childNode)
        }
        map.set(item.path, parent)
        return parent
      }
      const childNode: TreeNode = { path: item.path, name: item.name, active: false }
      if (parentNode) childNode.parent = parentNode
      map.set(item.path, childNode)
      return childNode
    }
    map.set(tree.path, getPaths(tree))

    for (const path of playlist.videoPaths) {
      const node = map.get(path)
      if (node) node.active = true
    }

    // Sync active state of children with parent if all children are active
    for (const [_, node] of map) {
      if (!node.children) continue
      const active = node.children.every(child => child.active)
      node.active = active
    }

    setActiveMap(map)
  }, [tree, playlist.videoPaths])

  // Sync active state of node with all parents if all children are active
  function syncActiveState(node: TreeNode) {
    function check(node: TreeNode) {
      if (node.children) {
        const active = node.children.every(child => child.active)
        node.active = active
      }
      if (node.parent) check(node.parent)
    }
    check(node)
  }

  // Select all children of a folder
  function selectFolder(folderPath: string) {
    const item = activeMap.get(folderPath)
    if (!item || !item.children) return
    function selectChildren(node: TreeNode) {
      node.active = true
      if (!node.children) return
      for (const child of node.children) { selectChildren(child) }
    }
    selectChildren(item)
    syncActiveState(item)
    setActiveMap(new Map(activeMap))
    updatePlaylistVideos(activeMap)
  }

  // Deselect all children of a folder
  function deselectFolder(folderPath: string) {
    const item = activeMap.get(folderPath)
    if (!item || !item.children) return
    function deselectChildren(node: TreeNode) {
      node.active = false
      if (!node.children) return
      for (const child of node.children) { deselectChildren(child) }
    }
    deselectChildren(item)
    syncActiveState(item)
    setActiveMap(new Map(activeMap))
    updatePlaylistVideos(activeMap)
  }

  // Select specific file path
  function selectFile(filePath: string) {
    const item = activeMap.get(filePath)
    if (!item) return
    item.active = true
    syncActiveState(item)
    setActiveMap(new Map(activeMap))
    updatePlaylistVideos(activeMap)
  }

  // Deselect specific file path
  function deselectFile(filePath: string) {
    const item = activeMap.get(filePath)
    if (!item) return
    item.active = false
    syncActiveState(item)
    setActiveMap(new Map(activeMap))
    updatePlaylistVideos(activeMap)
  }

  const indexMap = useMemo(() => {
    const indexMap = new Map<string, number>()
    if (!tree) return indexMap
    let index = 0
    function getPaths(item: FileTree) {
      if (!item.children) {
        indexMap.set(item.path, index)
        index++
      }
      else for (const child of item.children) { getPaths(child) }
    }
    getPaths(tree)
    return indexMap
  }, [tree])

  function updatePlaylistVideos(activeMap: Map<string, TreeNode>) {
    const pathsIndex: number[] = []
    for (const [path, node] of activeMap) {
      if (node.children || !node.active) continue
      // console.log(path)
      const index = indexMap.get(path)
      if (index !== undefined) pathsIndex.push(index)
    }
    console.log(pathsIndex)

    socket.emit(Msg.AdminEditPlaylistVideos, {
      playlistID: playlist.id,
      newVideoPaths: pathsIndex
    } as EditPlaylistVideosPayload)
  }

  const context: ContextProps = {
    playlist,
    tree,
    activeMap,
    selectFolder, deselectFolder,
    selectFile, deselectFile
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
  const { tree, activeMap } = usePlaylistFilePickerContext()
  const node = activeMap.get(tree.path)
  if (!node) return null
  return <TreeFolder item={node} depth={0} />
}

type TreeFolderProps = {
  item: TreeNode,
  depth: number
}

function TreeFolder({ item, depth }: TreeFolderProps) {
  const { selectFolder, deselectFolder } = usePlaylistFilePickerContext()

  const [isOpen, setIsOpen] = useState<boolean>(depth == 0)

  const isActive = item.active

  function toggleActive() {
    if (isActive) deselectFolder(item.path)
    else selectFolder(item.path) 
  }

  return (
    <div className={isActive ? `${styles.treeItem} ${styles.selected}` : styles.treeItem} style={depth === 0 ? undefined : { marginLeft: `1rem` }}>
      <div className={isActive ? `${styles.item} ${styles.selected}` : styles.item} onClick={() => setIsOpen(!isOpen)}>
        <input type="checkbox" checked={isActive} onChange={toggleActive} onClick={event => event.stopPropagation()} />
        <Icon name={isOpen ? 'folder-open' : 'folder'} />
        <span title={item.name}>{item.name}</span>
      </div>
      {isOpen && item.children && item.children.map(child => {
        if (child.children) return <TreeFolder key={child.path} item={child} depth={depth + 1} />
        return <TreeFile key={child.path} item={child} depth={depth + 1} />
      })}
    </div>
  )
}

type TreeFileProps = {
  item: TreeNode,
  depth: number
}

function TreeFile({ item, depth }: TreeFileProps) {
  const { selectFile, deselectFile } = usePlaylistFilePickerContext()

  const isActive = item.active

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