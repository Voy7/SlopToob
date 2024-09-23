'use client'

import { useState, useContext, createContext, useMemo, useEffect } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import Icon from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'
import FloatingContextMenu from '@/components/headless/FloatingContextMenu'
import VideoPickerContextMenu from '@/components/admin/VideoPickerContextMenu'
import SubSectionSelector from '@/components/ui/SubSectionSelector'
import { twMerge } from 'tailwind-merge'
import type { FileTreeNode } from '@/typings/types'

const SEARCH_TIMEOUT_MS = 150
const SEARCH_ITEMS_PER_MS = 1000
const SEARCH_MAX_ITEMS = 100

export default function ManualVideoPicker({ setClose }: { setClose: Function }) {
  return <ManualVideoPickerProvider setClose={setClose} />
}

type TreeNode = {
  path: string
  name: string
  parent?: TreeNode
  children?: TreeNode[]
}

type ShowMenuData = {
  selected: TreeNode
  position: [number, number]
}

// Manual video picker context
type ContextProps = {
  showMenuData: ShowMenuData | null
  selectFile: (node: TreeNode, event: React.MouseEvent) => void
  treeMap: Map<string, TreeNode>
  searchResults: Map<string, [number, number]> | null
}

// Context provider wrapper component
function ManualVideoPickerProvider({ setClose }: { setClose: Function }) {
  const { fileTree: tree, bumpers } = useAdminContext()
  if (!tree) return null

  const [showMenuData, setShowMenuData] = useState<ShowMenuData | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [searchResults, setSearchResults] = useState<Map<string, [number, number]> | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [filesSource, setFilesSource] = useState<string>('videos')

  const treeMap = useMemo(() => {
    const map = new Map<string, TreeNode>()

    // Videos file tree
    if (filesSource === 'videos') {
      function getPaths(item: FileTreeNode, parentNode?: TreeNode): TreeNode {
        if (item.children) {
          const parent: TreeNode = {
            path: item.path,
            name: item.name,
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
        const childNode: TreeNode = { path: item.path, name: item.name }
        if (parentNode) childNode.parent = parentNode
        map.set(item.path, childNode)
        return childNode
      }
      map.set(tree.path, getPaths(tree))
      return map
    }

    // Bumpers files
    const root: TreeNode = { path: 'bumpers', name: 'Bumpers', children: [] }
    map.set('bumpers', root)
    for (const bumper of bumpers) {
      const bumperNode: TreeNode = { path: bumper.path, name: bumper.name }
      root.children?.push(bumperNode)
      map.set(bumper.path, bumperNode)
    }
    return map
  }, [tree, bumpers, filesSource])

  function selectFile(node: TreeNode, event: React.MouseEvent) {
    event.preventDefault()
    if (showMenuData?.selected === node) {
      setShowMenuData(null)
      return
    }
    const elementTop = (event.target as HTMLElement).getBoundingClientRect().bottom
    setShowMenuData({ selected: node, position: [elementTop, event.clientX] })
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
      for (const [_, node] of treeMap) {
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
      for (const [_, node] of treeMap) {
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
          const aNode = treeMap.get(a[0])!
          const bNode = treeMap.get(b[0])!
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

  useEffect(() => {
    if (!showMenuData) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setShowMenuData(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenuData])

  const context: ContextProps = { showMenuData, selectFile, treeMap, searchResults }

  const rootNode = treeMap.get(filesSource === 'videos' ? tree.path : 'bumpers')
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
    <manualVideoPickerContext.Provider value={context}>
      <FloatingContextMenu
        show={showMenuData !== null}
        setShow={(show) => setShowMenuData(show ? showMenuData : null)}
        position={showMenuData?.position ?? [0, 0]}
        offset={0}>
        <div className="animate-fade-in rounded-lg border border-border1 bg-bg1 p-2 shadow-xl [animation-duration:50ms_!important]">
          {showMenuData && (
            <VideoPickerContextMenu
              onClick={() => {
                setShowMenuData(null)
                setClose()
              }}
              path={showMenuData.selected.path}
              isBumper={filesSource === 'bumpers'}
            />
          )}
        </div>
      </FloatingContextMenu>
      <div onContextMenu={(event) => event.preventDefault()}>
        <SubSectionSelector
          value={filesSource}
          setValue={setFilesSource}
          sections={[
            { id: 'videos', label: 'Videos', icon: 'video-file' },
            { id: 'bumpers', label: 'Bumpers', icon: 'bumper' }
          ]}
        />
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
    </manualVideoPickerContext.Provider>
  )
}

// Create the context and custom hook for it
const manualVideoPickerContext = createContext<ContextProps>(null as any)
const useManualVideoPickerContext = () => useContext(manualVideoPickerContext)

function SearchResultItems() {
  const { searchResults, treeMap } = useManualVideoPickerContext()
  if (searchResults === null || searchResults.size === 0) {
    return (
      <div className="flex cursor-default flex-col items-center justify-center gap-3 py-6 text-xs tracking-wide text-text3">
        <Icon name="search" className="text-2xl" />
        <p>No Results Found.</p>
      </div>
    )
  }

  return Array.from(searchResults).map(([path, highlightPos]) => {
    const node = treeMap.get(path)
    if (!node) return null
    if (node.children)
      return <TreeFolder key={path} node={node} depth={0} highlightPos={highlightPos} />
    return <TreeFile key={path} node={node} depth={0} highlightPos={highlightPos} />
  })
}

type TreeFolderProps = {
  node: TreeNode
  depth: number
  highlightPos?: [number, number]
  defaultOpen?: boolean
}

function TreeFolder({ node, depth, highlightPos, defaultOpen = false }: TreeFolderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)

  return (
    <>
      <div
        className="flex cursor-grab items-center justify-between gap-2 overflow-hidden py-[2px] pl-[5px] pr-[10px]"
        onClick={() => setIsOpen(!isOpen)}
        style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}>
        <div className="flex items-center gap-1 overflow-hidden">
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
  node: TreeNode
  depth: number
  highlightPos?: [number, number]
}

function TreeFile({ node, depth, highlightPos }: TreeFileProps) {
  const { selectFile, showMenuData } = useManualVideoPickerContext()

  return (
    <label
      className={twMerge(
        'flex cursor-pointer items-center justify-between gap-2 overflow-hidden py-[2px] pl-[5px] pr-[10px]',
        showMenuData?.selected === node ? 'bg-bg3 text-text1' : 'text-text2 hover:bg-bg2'
      )}
      style={depth === 0 ? undefined : { paddingLeft: `${depth * 1.25}rem` }}
      onMouseDown={(event) => selectFile(node, event)}>
      <div className="flex items-center gap-1 overflow-hidden">
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
