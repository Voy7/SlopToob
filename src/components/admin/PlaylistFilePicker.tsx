'use client'

import { useState, useContext, createContext, useEffect, useMemo } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'
import Icon from '@/components/ui/Icon'
import Checkbox from '@/components/ui/Checkbox'
import HoverTooltip from '@/components/ui/HoverTooltip'
import FloatingContextMenu from '@/components/headless/FloatingContextMenu'
import VideoPickerContextMenu from '@/components/admin/VideoPickerContextMenu'
import { twMerge } from 'tailwind-merge'
import type { FileTreeNode } from '@/typings/types'
import type { ClientPlaylist, EditPlaylistVideosPayload } from '@/typings/socket'

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

type ShowMenuData = {
  selected: ActiveTreeNode
  position: [number, number]
}

// Stream page context
type ContextProps = {
  activeMap: Map<string, ActiveTreeNode>
  searchResults: Map<string, [number, number]> | null
  selectFolder: (folderPath: string) => void
  deselectFolder: (folderPath: string) => void
  selectFile: (filePath: string) => void
  deselectFile: (filePath: string) => void
  selectContextMenu: (node: ActiveTreeNode, event: React.MouseEvent) => void
}

// Context provider wrapper component
function PlaylistFilePickerProvider({ playlist }: { playlist: ClientPlaylist }) {
  const { fileTree: tree, setPlaylists, lastReceivedPlaylistsDate } = useAdminContext()
  if (!tree) return null

  const { socket } = useSocketContext()

  const [showMenuData, setShowMenuData] = useState<ShowMenuData | null>(null)
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
        return
      }
      for (const child of item.children) {
        getPaths(child)
      }
    }
    getPaths(tree.rootNode)
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
    map.set(tree.rootNode.path, getPaths(tree.rootNode))

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
    setShowMenuData(null)
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

  function selectContextMenu(node: ActiveTreeNode, event: React.MouseEvent) {
    event.preventDefault()
    const elementTop = (event.target as HTMLElement).getBoundingClientRect().bottom
    setShowMenuData({ selected: node, position: [elementTop, event.clientX] })
  }

  useEffect(() => {
    if (!showMenuData) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setShowMenuData(null)
    }

    function handleMouseDown(event: MouseEvent) {
      setShowMenuData(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [showMenuData])

  const context: ContextProps = {
    activeMap,
    searchResults,
    selectFolder,
    deselectFolder,
    selectFile,
    deselectFile,
    selectContextMenu
  }

  const rootNode = activeMap.get(tree.rootNode.path)
  if (!rootNode) return null

  let rootElement: JSX.Element
  if (isSearching)
    rootElement = (
      <div className="flex cursor-default flex-col items-center justify-center gap-3 py-6 text-xs tracking-wide text-text3">
        <Icon name="loading" className="text-2xl" />
        <p>Searching Files...</p>
      </div>
    )
  else if (!searchResults) rootElement = <TreeFolder node={rootNode} depth={0} defaultOpen={true} />
  else rootElement = <SearchResultItems />

  return (
    <PlaylistFilePickerContext.Provider value={context}>
      <FloatingContextMenu
        show={showMenuData !== null}
        setShow={(show) => setShowMenuData(show ? showMenuData : null)}
        position={showMenuData?.position ?? [0, 0]}
        offset={0}>
        <div
          className="animate-fade-in rounded-lg border border-border1 bg-bg1 p-2 shadow-xl [animation-duration:50ms_!important]"
          onMouseDown={(event) => event.stopPropagation()}>
          {showMenuData && (
            <VideoPickerContextMenu
              onClick={() => {
                setShowMenuData(null)
              }}
              path={`${tree.rootPath}/${showMenuData.selected.path}`}
            />
          )}
        </div>
      </FloatingContextMenu>
      <div className="border border-border1" onContextMenu={(event) => event.preventDefault()}>
        <div className="relative">
          <input
            className="w-full resize-none border border-transparent bg-bg2 px-3 py-2 pl-8 text-base text-text3 focus:border-border1 focus:text-text1 focus:outline-none"
            type="text"
            value={searchInput}
            onChange={(event) => searchFiles(event.target.value)}
            placeholder="Search files..."
          />
          <Icon
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 transform text-xl text-gray-500"
            name="search"
          />
          {searchResults !== null && (
            <div className="absolute right-0 top-0 flex h-[calc(100%-2px)] cursor-default items-center bg-bg2 pr-2 text-sm text-text3">
              <p>
                {searchResults.size}
                {searchResults.size === SEARCH_MAX_ITEMS ? '+' : null} Results
              </p>
              <button
                onClick={() => searchFiles('')}
                className="flex h-full cursor-pointer items-center border-0 bg-transparent px-2 text-2xl text-text3 hover:text-text1">
                <HoverTooltip placement="top">Clear search results</HoverTooltip>
                <Icon name="close" />
              </button>
            </div>
          )}
        </div>
        <div className="overflow-hidden px-0 py-1">{rootElement}</div>
      </div>
    </PlaylistFilePickerContext.Provider>
  )
}

// Create the context and custom hook for it
const PlaylistFilePickerContext = createContext<ContextProps>(null as any)
const usePlaylistFilePickerContext = () => useContext(PlaylistFilePickerContext)

function SearchResultItems() {
  const { searchResults, activeMap } = usePlaylistFilePickerContext()
  if (searchResults === null || searchResults.size === 0) {
    return (
      <div className="flex cursor-default flex-col items-center justify-center gap-3 py-6 text-xs tracking-wide text-text3">
        <Icon name="search" className="text-2xl" />
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
        className={twMerge(
          'flex cursor-grab items-center justify-between gap-2 overflow-hidden py-[2px] pl-[5px] pr-[10px]',
          node.active ? 'bg-bg3 text-text1' : 'text-text2 hover:bg-bg2'
        )}
        onClick={() => setIsOpen(!isOpen)}
        style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}>
        <div className="flex items-center gap-1 overflow-hidden">
          <Checkbox
            checked={node.active}
            onChange={toggleActive}
            onClick={(event) => event.stopPropagation()}
          />
          <Icon name={isOpen ? 'folder-open' : 'folder'} />
          {!highlightPos ? (
            <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={node.name}>
              {node.name}
            </p>
          ) : (
            <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={node.name}>
              <>{node.name.slice(0, highlightPos[0])}</>
              <span className="bg-yellow-500 bg-opacity-25">
                {node.name.slice(highlightPos[0], highlightPos[1])}
              </span>
              <>{node.name.slice(highlightPos[1])}</>
            </p>
          )}
        </div>
        <div className="max-w-[33%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text3">
          <Icon
            name="down-chevron"
            className={twMerge(
              'transform transition-transform duration-150 ease-in-out',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
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
  const { selectFile, deselectFile, selectContextMenu } = usePlaylistFilePickerContext()

  function toggleActive() {
    if (node.active) deselectFile(node.path)
    else selectFile(node.path)
  }

  return (
    <label
      className={twMerge(
        'flex cursor-pointer items-center justify-between gap-2 overflow-hidden py-[2px] pl-[5px] pr-[10px]',
        node.active ? 'bg-bg3 text-text1' : 'text-text2 hover:bg-bg2'
      )}
      style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}
      onContextMenu={(event) => selectContextMenu(node, event)}>
      <div className="flex items-center gap-1 overflow-hidden">
        <Checkbox checked={node.active} onChange={toggleActive} />
        <Icon name="video-file" />
        {!highlightPos ? (
          <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={node.name}>
            {node.name}
          </p>
        ) : (
          <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={node.name}>
            <>{node.name.slice(0, highlightPos[0])}</>
            <span className="bg-yellow-500 bg-opacity-25">
              {node.name.slice(highlightPos[0], highlightPos[1])}
            </span>
            <>{node.name.slice(highlightPos[1])}</>
          </p>
        )}
      </div>
      {highlightPos && (
        <p
          className="max-w-[33%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text3"
          title={`${node.parent?.path}/`}>
          {node.parent?.path}/
        </p>
      )}
    </label>
  )
}
