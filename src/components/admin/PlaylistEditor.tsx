'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { useAdminContext } from '@/contexts/AdminContext'
import useSocketOn from '@/hooks/useSocketOn'
import { Msg } from '@/lib/enums'
import { SettingGroup, Header, Description, StringOption, ButtonOption } from '@/components/admin/SettingsComponents'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'
import styles from './PlaylistEditor.module.scss'
import type { ClientPlaylist, FileTree } from '@/typings/types'
import type { EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'

export default function PlaylistEditor({ playlist }: { playlist: ClientPlaylist }) {
  const { socket } = useStreamContext()

  const [playlistName, setPlaylistName] = useState<string>(playlist.name)
  const [playlistNameError, setPlaylistNameError] = useState<string | null>(null)
  const [activePaths, setActivePaths] = useState<string[]>(playlist.videoPaths)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [deletePlaylistLoading, setDeletePlaylistLoading] = useState<boolean>(false)
  const [deletePlaylistError, setDeletePlaylistError] = useState<string | null>(null)

  // Update playlist name when playlistName changes
  useEffect(() => {
    if (playlistName === playlist.name) return
    socket.emit(Msg.AdminEditPlaylistName, {
      playlistID: playlist.id,
      newName: playlistName
    } satisfies EditPlaylistNamePayload)
  }, [playlistName])

  // If event is received, it is an error
  useSocketOn(Msg.AdminEditPlaylistName, (error: string) => {
    setPlaylistNameError(error)
  })

  useSocketOn(Msg.AdminDeletePlaylist, (response: true | string) => {
    setDeletePlaylistLoading(false)
    if (response === true) return
    setDeletePlaylistError(response)
  })

  // Update playlist video paths when activePaths change
  useEffect(() => {
    if (activePaths === playlist.videoPaths) return
    socket.emit(Msg.AdminEditPlaylistVideos, {
      playlistID: playlist.id,
      newVideoPaths: activePaths
    } satisfies EditPlaylistVideosPayload)
  }, [activePaths])

  // Update and send out playlist name change when input is changed
  function onNameChange(value: string) {
    setPlaylistName(value)
    setPlaylistNameError(null)
  }

  // Delete playlist
  function deletePlaylist() {
    if (deletePlaylistLoading) return
    socket.emit(Msg.AdminDeletePlaylist, playlist.id)
  }

  return (
    <div className={styles.playlistEditor}>
      <SettingGroup>
        <Header icon="playlist">Playlist Details</Header>
        <StringOption
          label="Playlist Name"
          value={playlistName}
          setValue={onNameChange}
          error={playlistNameError}
        />
      </SettingGroup>
      <SettingGroup>
        <Header icon="files">Selected Videos ({activePaths.length})</Header>
        <FilePicker activePaths={activePaths} setActivePaths={setActivePaths} />
      </SettingGroup>
      <SettingGroup>
        <ButtonOption label="Permanently delete this playlist." swapped={true}>
          <Button style="danger" icon="delete" onClick={() => { setShowDeleteModal(true); setDeletePlaylistError(null) }}>Delete Playlist</Button>
        </ButtonOption>
      </SettingGroup>

      <ActionModal
        title="Delete Playlist"
        isOpen={showDeleteModal}
        setClose={() => setShowDeleteModal(false)}
        button={<Button style="danger" icon="delete" loading={deletePlaylistLoading} onClick={deletePlaylist}>Delete</Button>}
        error={deletePlaylistError}
      >
        <p>Are you sure you want to delete the playlist "{playlist.name}"?</p>
      </ActionModal>
    </div>
  )
}

type FileTreeProps = {
  activePaths: string[],
  setActivePaths: (paths: string[]) => void
}

function FilePicker({ activePaths, setActivePaths }: FileTreeProps) {
  const { fileTree: tree } = useAdminContext()
  if (!tree) return null

  const [openFolders, setOpenFolders] = useState<string[]>([tree.path])

  const allPaths: string[] = []
  function getPaths(item: FileTree) {
    if (!item.isDirectory) allPaths.push(item.path)
    else if (item.children) for (const child of item.children) { getPaths(child) }
  }
  getPaths(tree)

  return (
    <div className={styles.filePicker}>
      <TreeFolder item={tree} depth={0} openFolders={openFolders} setOpenFolders={setOpenFolders} allPaths={allPaths} activePaths={activePaths} setActivePaths={setActivePaths} />
    </div>
  )
}

type TreeFolderProps = {
  item: FileTree,
  depth: number,
  openFolders: string[],
  setOpenFolders: (folders: string[]) => void,
  allPaths: string[],
  activePaths: string[],
  setActivePaths: (paths: string[]) => void
}

function TreeFolder({ item, depth, openFolders, setOpenFolders, allPaths, activePaths, setActivePaths }: TreeFolderProps) {
  const childrenPaths = useMemo(() => {
    return allPaths.filter(path => path.startsWith(item.path + '/'))
  }, [allPaths])

  const isActive = useMemo(() => {
    return childrenPaths.every(path => activePaths.includes(path))
  }, [activePaths])

  const isFolderOpen = useMemo(() => {
    return openFolders.includes(item.path)
  }, [openFolders])

  function toggleActive() {
    const newActivePaths = isActive
      ? activePaths.filter(path => !childrenPaths.includes(path))
      : [...activePaths, ...childrenPaths]
    setActivePaths(newActivePaths)
  }

  function toggleOpen() {
    if (openFolders.includes(item.path)) setOpenFolders(openFolders.filter(path => path !== item.path))
    else setOpenFolders([...openFolders, item.path])
  }

  let children: JSX.Element[] | null = null
  if (item.children && isFolderOpen) {
    children = item.children.map(child => {
      if (child.isDirectory) return <TreeFolder key={child.path} item={child} depth={depth + 1} openFolders={openFolders} setOpenFolders={setOpenFolders} allPaths={allPaths} activePaths={activePaths} setActivePaths={setActivePaths} />
      return <TreeFile key={child.path} item={child} depth={depth + 1} activePaths={activePaths} setActivePaths={setActivePaths} />
    })
  }

  return (
    <div className={isActive ? `${styles.treeItem} ${styles.selected}` : styles.treeItem} style={depth === 0 ? undefined : { marginLeft: `1rem` }}>
      <div className={isActive ? `${styles.item} ${styles.selected}` : styles.item} onClick={toggleOpen}>
        <input type="checkbox" checked={isActive} onChange={toggleActive} onClick={event => event.stopPropagation()} />
        <Icon name={isFolderOpen ? 'folder-open' : 'folder'} />
        <span title={item.name}>{item.name}</span>
      </div>
      {children}
    </div>
  )
}

type TreeFileProps = {
  item: FileTree,
  depth: number,
  activePaths: string[],
  setActivePaths: (paths: string[]) => void
}

function TreeFile({ item, depth, activePaths, setActivePaths }: TreeFileProps) {
  const isActive = useMemo(() => {
    return activePaths.includes(item.path)
  }, [activePaths])

  function toggleActive() {
    if (isActive) setActivePaths(activePaths.filter(path => path !== item.path))
    else setActivePaths([...activePaths, item.path])
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