import fs from 'fs'
import fsAsync from 'fs/promises'
import path from 'path'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import { SocketEvent } from '@/lib/enums'
import type { FileTree } from '@/typings/types'

const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.m2ts']

export default new class FileTreeHandler {
  private _tree: FileTree | null = null
  private paths: string[] = []
  private onReadyCallback: (() => void) | null = null
  private refreshTimeout: NodeJS.Timeout | null = null

  constructor() { this.initialize() }

  private async initialize() {
    Logger.info('Initializing file tree handler...')
    const startDate = Date.now()

    const paths: string[] = []
    const rootPath = Env.VIDEOS_PATH

    async function getChildren(pathname: string) {
      const files = await fsAsync.readdir(pathname, { withFileTypes: true })
      for (const file of files) {
        if (file.isDirectory()) await getChildren(`${pathname}/${file.name}`)
        else {
          const ext = path.extname(file.name).toLowerCase()
          if (!VALID_EXTENSIONS.includes(ext)) continue
          paths.push(path.join(pathname, file.name).replace(/\\/g, '/'))
        }
      }
    }

    await getChildren(rootPath)
    this.paths = paths
    this.pathsToTree(false)
    console.log(this.paths)
    console.log(this._tree)

    const passedSeconds = (Date.now() - startDate) / 1000
    Logger.info(`File tree handler fetched tree in ${passedSeconds.toFixed(1)}s.`)

    this.onReadyCallback?.()

    // Watch & update tree if 1* seconds pass without any more changes
    fs.watch(Env.VIDEOS_PATH, { recursive: true }, (event, filename) => {
      if (!filename) return
      if (event !== 'change' && event !== 'rename') return

      
      // Remove/add path to paths array
      const fullPath = path.join(Env.VIDEOS_PATH, filename).replace(/\\/g, '/')
      const fileExists = fs.existsSync(fullPath)
      const index = this.paths.indexOf(fullPath)
      console.log(fullPath, fileExists, index)

      // File was deleted
      if (!fileExists) {
        // If has no extension, it's a directory
        const isDirectory = path.extname(filename) === ''
        if (!isDirectory && index !== -1) this.paths.splice(index, 1)

        // If it's a directory, remove all files inside it
        if (isDirectory) {
          const files = this.paths.filter(p => p.startsWith(fullPath + '/'))
          for (const file of files) {
            const fileIndex = this.paths.indexOf(file)
            if (fileIndex !== -1) this.paths.splice(fileIndex, 1)
          }
        }
      }

      // File was added
      if (fileExists && index === -1) {
        const ext = path.extname(filename).toLowerCase()
        if (VALID_EXTENSIONS.includes(ext)) this.paths.push(fullPath)
      }

      if (this.refreshTimeout) clearTimeout(this.refreshTimeout)
      this.refreshTimeout = setTimeout(() => this.pathsToTree(true), 1000)
    })
  }

  // Transform paths array to a tree structure
  private pathsToTree(logDone: boolean) {
    const rootPath = Env.VIDEOS_PATH
    const rootName = rootPath.slice(rootPath.lastIndexOf('/') + 1)
    
    const tree: FileTree = {
      isDirectory: true,
      name: rootName,
      path: rootPath,
      children: []
    }
    
    for (const pathn of this.paths) {
      const parts = pathn.replace(rootPath, '').split('/')
      let parent = tree
      let currentPath = rootPath
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i]
        currentPath += `/${part}`

        let child = parent.children?.find(c => c.name === part)
        if (!child) {
          child = {
            isDirectory: i < parts.length - 1,
            name: part,
            path: currentPath
          }
          if (child.isDirectory) child.children = []
          parent.children?.push(child)
        }

        parent = child
      }
    }

    // Sort tree alphabetically, and sort directories first
    function sortChildren(children: FileTree[]) {
      children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
      for (const child of children) {
        if (child.children) sortChildren(child.children)
      }
    }
    
    if (tree.children) sortChildren(tree.children)

    this._tree = tree
    if (logDone) Logger.debug('File tree object reconstructed.')
    SocketUtils.broadcastAdmin(SocketEvent.AdminRequestFileTree, this.tree)
  }

  onReady(callback: () => void) {
    if (this._tree) return callback()
    this.onReadyCallback = callback
  }

  get tree(): FileTree {
    if (!this._tree) throw new Error('Tried to get file tree before it was initialized.')
    return this._tree
  }
}