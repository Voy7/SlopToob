'use client'

import Icon from '@/components/ui/Icon'
import styles from './FilePicker.module.scss'
import type { FileTree } from '@/typings/types'
import { useState } from 'react'


type Props = {
  tree: FileTree,
  activePaths: string[],
  setActivePaths: (paths: string[]) => void
}

export default function FilePicker({ tree, activePaths, setActivePaths }: Props) {
  const [openFolders, setOpenFolders] = useState<string[]>([tree.path])

  const allPaths: string[] = []
  function getPaths(item: FileTree) {
    if (!item.isDirectory) allPaths.push(item.path)
    else if (item.children) for (const child of item.children) { getPaths(child) }
  }
  getPaths(tree)

  return (
    <div className={styles.filePicker}>
      <TreeItem item={tree} depth={0} openFolders={openFolders} setOpenFolders={setOpenFolders} allPaths={allPaths} activePaths={activePaths} setActivePaths={setActivePaths} />
    </div>
  )
}

type TreeItemProps = {
  item: FileTree,
  depth: number,
  openFolders: string[],
  setOpenFolders: (folders: string[]) => void,
  allPaths: string[],
  activePaths: string[],
  setActivePaths: (paths: string[]) => void
}

function TreeItem({ item, depth, openFolders, setOpenFolders, allPaths, activePaths, setActivePaths }: TreeItemProps) {
  const childrenPaths = allPaths.filter(path => path.startsWith(item.path))

  const isActive = item.isDirectory
    ? childrenPaths.every(path => activePaths.includes(path))
    : activePaths.includes(item.path)

  function toggleActive() {
    // If item is a directory, toggle all children as well, simply check if the path starts with the parent path
    // Never add an isDirectory item to activePaths, only real files
    if (item.isDirectory) {
      const newActivePaths = isActive
        ? activePaths.filter(path => !childrenPaths.includes(path))
        : [...activePaths, ...childrenPaths]
      setActivePaths(newActivePaths)
      return
    }

    if (isActive) setActivePaths(activePaths.filter(path => path !== item.path))
    else setActivePaths([...activePaths, item.path])
  }

  const isFolderOpen = openFolders.includes(item.path)

  function toggleOpen() {
    if (!item.isDirectory) return
    if (openFolders.includes(item.path)) setOpenFolders(openFolders.filter(path => path !== item.path))
    else setOpenFolders([...openFolders, item.path])
  }

  return (
    <div className={isActive ? `${styles.treeItem} ${styles.selected}` : styles.treeItem} style={depth === 0 ? undefined : { marginLeft: `1rem` }}>
      {item.isDirectory ? (
        <div className={isActive ? `${styles.item} ${styles.selected}` : styles.item} onClick={toggleOpen}>
          <input type="checkbox" checked={isActive} onChange={toggleActive} onClick={event => event.stopPropagation()} />
          <Icon name={isFolderOpen ? 'folder-open' : 'folder'} />
          <span>{item.name}</span>
        </div>
      ) : (
        <label className={isActive ? `${styles.item} ${styles.selected}` : styles.item}>
          <input type="checkbox" checked={isActive} onChange={toggleActive} />
          <Icon name="video-file" />
          <span>{item.name}</span>
        </label>
      )}
      {isFolderOpen && item.children && item.children.map(child => (
        <TreeItem key={child.path} item={child} depth={depth + 1} openFolders={openFolders} setOpenFolders={setOpenFolders} allPaths={allPaths} activePaths={activePaths} setActivePaths={setActivePaths} />
      ))}
    </div>
  )
}