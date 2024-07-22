'use client'

import { useState, useContext, createContext, useEffect, useMemo } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import useTooltip from '@/hooks/useTooltip'
import { Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Tooltip from '@/components/ui/Tooltip'
import styles from './PlaylistFilePicker.module.scss'
import type { ClientPlaylist, FileTreeNode } from '@/typings/types'
import type { EditPlaylistVideosPayload } from '@/typings/socket'

const SEARCH_TIMEOUT_MS = 150
const SEARCH_ITEMS_PER_MS = 1000
const SEARCH_MAX_ITEMS = 100

export default function PlaylistFilePicker({ playlist }: { playlist: ClientPlaylist }) {
  return <PlaylistFilePickerProvider playlist={playlist} />
}

type ActiveTreeNode = {
  path: string
  name: string
  active: boolean
  parent?: ActiveTreeNode
  children?: ActiveTreeNode[]
}

// Stream page context
type ContextProps = {
  activeMap: Map<string, ActiveTreeNode>
  searchResults: Map<string, [number, number]> | null
  selectFolder: (folderPath: string) => void
  deselectFolder: (folderPath: string) => void
  selectFile: (filePath: string) => void
  deselectFile: (filePath: string) => void
}

// Context provider wrapper component
function PlaylistFilePickerProvider({ playlist }: { playlist: ClientPlaylist }) {
  const { fileTree: tree, setPlaylists, lastReceivedPlaylistsDate } = useAdminContext()
  if (!tree) return null

  const { socket } = useSocketContext()

  const [activeMap, setActiveMap] = useState<Map<string, ActiveTreeNode>>(new Map())
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [searchResults, setSearchResults] = useState<Map<string, [number, number]> | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')

  const [indexesMap, pathsArray] = useMemo(() => {
    const indexesMap = new Map<string, number>()
    const pathsArray: string[] = []
    if (!tree) return [indexesMap, pathsArray]
    let index = 0
    function getPaths(item: FileTreeNode) {
      if (!item.children) {
        indexesMap.set(item.path, index)
        pathsArray.push(item.path)
        index++
      } else
        for (const child of item.children) {
          getPaths(child)
        }
    }
    getPaths(tree)
    return [indexesMap, pathsArray]
  }, [tree])

  // Create map of all paths and if they're active (if they're in playlist.videoPaths)
  useEffect(() => {
    const map = new Map<string, ActiveTreeNode>()
    function getPaths(item: FileTreeNode, parentNode?: ActiveTreeNode): ActiveTreeNode {
      if (item.children) {
        const parent: ActiveTreeNode = {
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
      const childNode: ActiveTreeNode = { path: item.path, name: item.name, active: false }
      if (parentNode) childNode.parent = parentNode
      map.set(item.path, childNode)
      return childNode
    }
    map.set(tree.path, getPaths(tree))

    for (const pathIndex of playlist.videoPaths) {
      const node = map.get(pathsArray[pathIndex])
      if (node) node.active = true
    }

    // Sync active state of children with parent if all children are active
    for (const [_, node] of map) {
      if (!node.children) continue
      const active = node.children.every((child) => child.active)
      node.active = active
    }

    setActiveMap(map)
  }, [tree, lastReceivedPlaylistsDate])

  // Sync active state of node with all parents if all children are active
  function syncActiveState(node: ActiveTreeNode) {
    function check(node: ActiveTreeNode) {
      if (node.children) {
        const active = node.children.every((child) => child.active)
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
    function selectChildren(node: ActiveTreeNode) {
      node.active = true
      if (!node.children) return
      for (const child of node.children) {
        selectChildren(child)
      }
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
    function deselectChildren(node: ActiveTreeNode) {
      node.active = false
      if (!node.children) return
      for (const child of node.children) {
        deselectChildren(child)
      }
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

  function updatePlaylistVideos(activeMap: Map<string, ActiveTreeNode>) {
    const pathsIndex: number[] = []
    for (const [path, node] of activeMap) {
      if (node.children || !node.active) continue
      const index = indexesMap.get(path)
      if (index !== undefined) pathsIndex.push(index)
    }

    // Update admin context playlists state
    setPlaylists((playlists) => {
      return playlists.map((p) => {
        if (playlist.id !== p.id) return p
        return { ...p, videoPaths: pathsIndex }
      })
    })

    socket.emit(Msg.AdminEditPlaylistVideos, {
      playlistID: playlist.id,
      newVideoPaths: pathsIndex
    } as EditPlaylistVideosPayload)
  }

  function searchFiles(input: string) {
    setSearchInput(input)
    if (searchTimeout) clearTimeout(searchTimeout)

    input = input.replace(/\s+/g, '') // Remove all spaces
    if (!input) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)

      const results = new Map<string, [number, number]>()
      // Regex - match all characters in input in order, with any whitespace in between
      const regex = new RegExp(input.split('').join('\\s*'), 'i')
      let items = 0
      for (const [_, node] of activeMap) {
        // First folders
        if (results.size >= SEARCH_MAX_ITEMS) break
        if (!node.children) continue
        items += 1
        if (items % SEARCH_ITEMS_PER_MS === 0)
          await new Promise((resolve) => setTimeout(resolve, 1))
        const matches = node.name.match(regex)
        if (matches?.index !== undefined)
          results.set(node.path, [matches.index, matches.index + matches[0].length])
      }
      for (const [_, node] of activeMap) {
        // Then files
        if (results.size >= SEARCH_MAX_ITEMS) break
        if (node.children) continue
        items += 1
        if (items % SEARCH_ITEMS_PER_MS === 0)
          await new Promise((resolve) => setTimeout(resolve, 1))
        const matches = node.name.match(regex)
        if (matches?.index !== undefined)
          results.set(node.path, [matches.index, matches.index + matches[0].length])
      }

      // Sort results by folders first, and names naturally (case-insensitive)
      const sortedResults = new Map(
        [...results.entries()].sort((a, b) => {
          const aNode = activeMap.get(a[0])!
          const bNode = activeMap.get(b[0])!
          if (aNode.children && !bNode.children) return -1
          if (!aNode.children && bNode.children) return 1
          return aNode.name.localeCompare(bNode.name, undefined, { sensitivity: 'base' })
        })
      )

      setSearchResults(sortedResults)
      setIsSearching(false)
    }, SEARCH_TIMEOUT_MS)
    setSearchTimeout(timeout)
  }

  const context: ContextProps = {
    activeMap,
    searchResults,
    selectFolder,
    deselectFolder,
    selectFile,
    deselectFile
  }

  const rootNode = activeMap.get(tree.path)
  if (!rootNode) return null

  let rootElement: JSX.Element
  if (isSearching)
    rootElement = (
      <div className={styles.searchLoading}>
        <Icon name="loading" />
        <p>Searching Files...</p>
      </div>
    )
  else if (!searchResults) rootElement = <TreeFolder node={rootNode} depth={0} defaultOpen={true} />
  else rootElement = <SearchResultItems />

  return (
    <PlaylistFilePickerContext.Provider value={context}>
      <div className={styles.filePicker}>
        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => searchFiles(event.target.value)}
            placeholder="Search files..."
          />
          <Icon className={styles.searchIcon} name="search" />
          {searchResults !== null && (
            <div className={styles.resultsCount}>
              <p>
                {searchResults.size}
                {searchResults.size === SEARCH_MAX_ITEMS ? '+' : null} Results
              </p>
              <ClearResultsButton onClick={() => searchFiles('')} />
            </div>
          )}
        </div>
        <div className={styles.items}>{rootElement}</div>
      </div>
    </PlaylistFilePickerContext.Provider>
  )
}

// Create the context and custom hook for it
const PlaylistFilePickerContext = createContext<ContextProps>(null as any)
const usePlaylistFilePickerContext = () => useContext(PlaylistFilePickerContext)

function ClearResultsButton({ onClick }: { onClick: Function }) {
  const buttonTooltip = useTooltip('top-end')
  return (
    <>
      <button
        {...buttonTooltip.anchorProps}
        onClick={() => onClick()}
        className={styles.clearResultsButton}
      >
        <Icon name="close" />
      </button>
      <Tooltip {...buttonTooltip.tooltipProps}>Clear search results</Tooltip>
    </>
  )
}

function SearchResultItems() {
  const { searchResults, activeMap } = usePlaylistFilePickerContext()
  if (searchResults === null || searchResults.size === 0) {
    return (
      <div className={styles.searchLoading}>
        <Icon name="search" />
        <p>No Results Found.</p>
      </div>
    )
  }

  return Array.from(searchResults).map(([path, highlightPos]) => {
    const node = activeMap.get(path)
    if (!node) return null
    if (node.children)
      return <TreeFolder key={path} node={node} depth={0} highlightPos={highlightPos} />
    return <TreeFile key={path} node={node} depth={0} highlightPos={highlightPos} />
  })
}

type TreeFolderProps = {
  node: ActiveTreeNode
  depth: number
  highlightPos?: [number, number]
  defaultOpen?: boolean
}

function TreeFolder({ node, depth, highlightPos, defaultOpen = false }: TreeFolderProps) {
  const { selectFolder, deselectFolder } = usePlaylistFilePickerContext()

  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)

  function toggleActive() {
    if (node.active) deselectFolder(node.path)
    else selectFolder(node.path)
  }

  return (
    <>
      <div
        className={node.active ? `${styles.item} ${styles.selected}` : styles.item}
        onClick={() => setIsOpen(!isOpen)}
        style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}
      >
        <div className={styles.left}>
          <input
            type="checkbox"
            checked={node.active}
            onChange={toggleActive}
            onClick={(event) => event.stopPropagation()}
          />
          <Icon name={isOpen ? 'folder-open' : 'folder'} />
          {!highlightPos ? (
            <p title={node.name}>{node.name}</p>
          ) : (
            <p title={node.name}>
              <>{node.name.slice(0, highlightPos[0])}</>
              <span>{node.name.slice(highlightPos[0], highlightPos[1])}</span>
              <>{node.name.slice(highlightPos[1])}</>
            </p>
          )}
        </div>
        <div className={styles.right}>
          <Icon name="down-chevron" className={isOpen ? styles.open : undefined} />
        </div>
      </div>
      {isOpen &&
        node.children &&
        node.children.map((child) => {
          if (child.children) return <TreeFolder key={child.path} node={child} depth={depth + 1} />
          return <TreeFile key={child.path} node={child} depth={depth + 1} />
        })}
    </>
  )
}

type TreeFileProps = {
  node: ActiveTreeNode
  depth: number
  highlightPos?: [number, number]
}

function TreeFile({ node, depth, highlightPos }: TreeFileProps) {
  const { selectFile, deselectFile } = usePlaylistFilePickerContext()

  function toggleActive() {
    if (node.active) deselectFile(node.path)
    else selectFile(node.path)
  }

  return (
    <label
      className={node.active ? `${styles.item} ${styles.selected}` : styles.item}
      style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}
    >
      <div className={styles.left}>
        <input type="checkbox" checked={node.active} onChange={toggleActive} />
        <Icon name="video-file" />
        {!highlightPos ? (
          <p title={node.name}>{node.name}</p>
        ) : (
          <p title={node.name}>
            <>{node.name.slice(0, highlightPos[0])}</>
            <span>{node.name.slice(highlightPos[0], highlightPos[1])}</span>
            <>{node.name.slice(highlightPos[1])}</>
          </p>
        )}
      </div>
      {highlightPos && (
        <p className={styles.right} title={`${node.parent?.path}/`}>
          {node.parent?.path}/
        </p>
      )}
    </label>
  )
}
