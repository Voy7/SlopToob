import fs from 'fs'
import path from 'path'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Checklist from '@/server/Checklist'
import FsWatcher from '@/server/FsWatcher'
import SocketUtils from '@/server/socket/SocketUtils'
import { Msg } from '@/lib/enums'
import type { FileTreeNode } from '@/typings/types'

const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.m2ts']

export default new (class FileTreeHandler {
  private _tree: FileTreeNode | null = null
  private paths: string[] = []
  private onTreeChangeCallbacks: Function[] = []
  private onReadyCallback: Function | null = null
  private refreshTimeout: NodeJS.Timeout | null = null
  private pathIndexesMap: Map<string, number> = new Map()

  constructor() {
    this.initialize()
  }

  private async initialize() {
    Checklist.running('fileTreeReady', `Indexing file tree... (${Env.VIDEOS_PATH})`)

    const startDate = Date.now()

    this.paths = await this.fetchInitialPaths()

    // Special development test option to test large fake file trees
    if (Env.DEV_FILE_TREE_TEST) {
      const { fakePaths } = await import('@/lib/fileTreeTest')
      this.paths = fakePaths
      Logger.debug(`[FileTreeHandler] DEV: Using fake file tree with ${fakePaths.length} paths.`)
    }

    this.buildTreeObject(false)

    const passedSeconds = ((Date.now() - startDate) / 1000).toFixed(2)
    const fileCount = this.paths.length.toLocaleString()
    Checklist.pass('fileTreeReady', `Indexed ${fileCount} files in ${passedSeconds}s.`)

    this.onReadyCallback?.()

    // Watch & update tree if 1* seconds pass without any more changes
    const watcher = new FsWatcher(Env.VIDEOS_PATH)

    watcher.onNewFile((filePath) => {
      const ext = path.extname(filePath).toLowerCase()
      if (!VALID_EXTENSIONS.includes(ext)) return
      // if (this.paths.includes(filePath)) return

      this.paths.push(filePath)
      if (this.refreshTimeout) clearTimeout(this.refreshTimeout)
      this.refreshTimeout = setTimeout(() => this.buildTreeObject(true), 1000)
    })

    watcher.onDeleteFile((filePath) => {
      const index = this.paths.indexOf(filePath)
      if (index === -1) return

      this.paths.splice(index, 1)
      if (this.refreshTimeout) clearTimeout(this.refreshTimeout)
      this.refreshTimeout = setTimeout(() => this.buildTreeObject(true), 1000)
    })

    watcher.activate()
  }

  private async fetchInitialPaths(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      function walk(dir: string, done: (results: string[], error?: Error) => void) {
        const results: string[] = []
        fs.readdir(dir, { withFileTypes: true }, (err, list) => {
          if (err) return done(results, err)
          let pending = list.length
          if (!pending) return done(results)
          list.forEach((file) => {
            const filePath = `${dir}/${file.name}`
            if (file.isDirectory()) {
              walk(filePath, (res) => {
                if (res) results.push(...res)
                if (!--pending) done(results)
              })
            } else {
              const ext = path.extname(file.name).toLowerCase()
              if (VALID_EXTENSIONS.includes(ext)) results.push(filePath)
              if (!--pending) done(results)
            }
          })
        })
      }

      walk(Env.VIDEOS_PATH, (results, error) => {
        if (error) reject(error)
        else resolve(results)
      })
    })
  }

  // Transform paths array to a tree structure
  private buildTreeObject(logDone: boolean) {
    const startTime = Date.now()

    const rootPath = Env.VIDEOS_PATH
    const rootName = rootPath.slice(rootPath.lastIndexOf('/') + 1)

    const tree: FileTreeNode = {
      name: rootName,
      path: '',
      children: []
    }

    for (const pathn of this.paths) {
      const parts = pathn.replace(rootPath, '').split('/')
      let parent = tree
      let currentPath = ''
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i]
        currentPath += `/${part}`

        let child = parent.children?.find((c) => c.name === part)
        if (!child) {
          child = { name: part, path: `${currentPath}` }
          if (i < parts.length - 1) child.children = []
          parent.children?.push(child)
        }

        parent = child
      }
    }

    // Sort tree alphabetically, and sort directories first
    function sortChildren(children: FileTreeNode[]) {
      children.sort((a, b) => {
        if (a.children && !b.children) return -1
        if (!a.children && b.children) return 1
        return a.name.localeCompare(b.name, undefined, { numeric: true })
      })
      for (const child of children) {
        if (child.children) sortChildren(child.children)
      }
    }

    if (tree.children) sortChildren(tree.children)

    this._tree = tree
    this.pathIndexesMap = this.treeToIndexesMap(tree)
    for (const callback of this.onTreeChangeCallbacks) callback()

    if (logDone) {
      const passedSeconds = ((Date.now() - startTime) / 1000).toFixed(3)
      Logger.debug(`[FileTreeHandler] Main tree object reconstructed in ${passedSeconds}s.`)
    }
    SocketUtils.broadcastAdmin(Msg.AdminFileTree, this.tree)
  }

  private treeToIndexesMap(tree: FileTreeNode): Map<string, number> {
    const map = new Map<string, number>()
    let index = 0
    function buildIndexesMap(item: FileTreeNode) {
      if (!item.children) {
        map.set(`${Env.VIDEOS_PATH}${item.path}`, index)
        index++
      } else
        for (const child of item.children) {
          buildIndexesMap(child)
        }
    }
    buildIndexesMap(tree)
    return map
  }

  getPathIndexes(paths: string[]): number[] {
    const indexes: number[] = []
    for (const path of paths) {
      const index = this.pathIndexesMap.get(path)
      if (index !== undefined) indexes.push(index)
    }
    return indexes
  }

  onTreeChange(callback: Function) {
    this.onTreeChangeCallbacks.push(callback)
  }

  async onReady() {
    if (this._tree) return
    return new Promise<void>((resolve) => {
      this.onReadyCallback = resolve
    })
  }

  get tree(): FileTreeNode {
    if (!this._tree) throw new Error('Tried to get file tree before it was initialized.')
    return this._tree
  }
})()

// import fs from 'fs'
// import fsAsync from 'fs/promises'
// import path from 'path'
// import Env from '@/server/EnvVariables'
// import Logger from '@/server/Logger'
// import Checklist from '@/server/Checklist'
// import SocketUtils from '@/server/socket/SocketUtils'
// import { Msg } from '@/lib/enums'
// import type { FileTreeNode } from '@/typings/types'

// const VALID_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.m2ts']

// export default new (class FileTreeHandler {
//   private _tree: FileTreeNode | null = null
//   private paths: string[] = []
//   private onTreeChangeCallbacks: Function[] = []
//   private onReadyCallback: Function | null = null
//   private refreshTimeout: NodeJS.Timeout | null = null
//   private pathIndexesMap: Map<string, number> = new Map()

//   constructor() {
//     this.initialize()
//   }

//   private async initialize() {
//     Checklist.running('fileTreeReady', `Indexing file tree... (${Env.VIDEOS_PATH})`)

//     const startDate = Date.now()

//     const paths: string[] = []
//     const rootPath = Env.VIDEOS_PATH

//     async function getChildren(pathname: string) {
//       const files = await fsAsync.readdir(pathname, { withFileTypes: true })
//       for (const file of files) {
//         if (file.isDirectory()) await getChildren(`${pathname}/${file.name}`)
//         else {
//           const ext = path.extname(file.name).toLowerCase()
//           if (!VALID_EXTENSIONS.includes(ext)) continue
//           paths.push(path.join(pathname, file.name).replace(/\\/g, '/'))
//         }
//       }
//     }

//     await getChildren(rootPath)
//     this.paths = paths

//     // Special development test option to test large fake file trees
//     if (Env.DEV_FILE_TREE_TEST) {
//       const { fakePaths } = await import('@/lib/fileTreeTest')
//       this.paths = fakePaths
//       Logger.debug(`[FileTreeHandler] DEV: Using fake file tree with ${fakePaths.length} paths.`)
//     }

//     this.buildTreeObject(false)

//     const passedSeconds = (Date.now() - startDate) / 1000
//     Checklist.pass('fileTreeReady', `Fetched tree in ${passedSeconds.toFixed(2)}s.`)

//     this.onReadyCallback?.()

//     // Watch & update tree if 1* seconds pass without any more changes
//     fs.watch(Env.VIDEOS_PATH, { recursive: true }, (event, filename) => {
//       if (!filename) return

//       // Only trigger if file is added/deleted/renamed
//       if (event !== 'change' && event !== 'rename') return

//       const fullPath = path.join(Env.VIDEOS_PATH, filename).replace(/\\/g, '/')
//       const fileExists = fs.existsSync(fullPath)
//       const isInTree = this.paths.includes(fullPath)

//       if (isInTree && fileExists) return
//       if (!isInTree && !fileExists) return

//       // Remove/add path to paths array
//       const index = this.paths.indexOf(fullPath)

//       // File was deleted
//       if (!fileExists) {
//         // If has no extension, it's a directory
//         const isDirectory = path.extname(filename) === ''
//         if (!isDirectory && index !== -1) this.paths.splice(index, 1)

//         // If it's a directory, remove all files inside it
//         if (isDirectory) {
//           const files = this.paths.filter((p) => p.startsWith(fullPath + '/'))
//           for (const file of files) {
//             const fileIndex = this.paths.indexOf(file)
//             if (fileIndex !== -1) this.paths.splice(fileIndex, 1)
//           }
//         }
//       }

//       // File was added
//       if (fileExists && index === -1) {
//         const ext = path.extname(filename).toLowerCase()
//         if (VALID_EXTENSIONS.includes(ext)) this.paths.push(fullPath)
//       }

//       if (this.refreshTimeout) clearTimeout(this.refreshTimeout)
//       this.refreshTimeout = setTimeout(() => this.buildTreeObject(true), 1000)
//     })
//   }

//   // Transform paths array to a tree structure
//   private buildTreeObject(logDone: boolean) {
//     const startTime = Date.now()

//     const rootPath = Env.VIDEOS_PATH
//     const rootName = rootPath.slice(rootPath.lastIndexOf('/') + 1)

//     const tree: FileTreeNode = {
//       name: rootName,
//       path: '',
//       children: []
//     }

//     for (const pathn of this.paths) {
//       const parts = pathn.replace(rootPath, '').split('/')
//       let parent = tree
//       let currentPath = ''
//       for (let i = 1; i < parts.length; i++) {
//         const part = parts[i]
//         currentPath += `/${part}`

//         let child = parent.children?.find((c) => c.name === part)
//         if (!child) {
//           child = { name: part, path: `${currentPath}` }
//           if (i < parts.length - 1) child.children = []
//           parent.children?.push(child)
//         }

//         parent = child
//       }
//     }

//     // Sort tree alphabetically, and sort directories first
//     function sortChildren(children: FileTreeNode[]) {
//       children.sort((a, b) => {
//         if (a.children && !b.children) return -1
//         if (!a.children && b.children) return 1
//         return a.name.localeCompare(b.name, undefined, { numeric: true })
//       })
//       for (const child of children) {
//         if (child.children) sortChildren(child.children)
//       }
//     }

//     if (tree.children) sortChildren(tree.children)

//     this._tree = tree
//     this.pathIndexesMap = this.treeToIndexesMap(tree)
//     for (const callback of this.onTreeChangeCallbacks) callback()

//     if (logDone) {
//       const passedSeconds = ((Date.now() - startTime) / 1000).toFixed(3)
//       Logger.debug(`[FileTreeHandler] Main tree object reconstructed in ${passedSeconds}s.`)
//     }
//     SocketUtils.broadcastAdmin(Msg.AdminFileTree, this.tree)
//   }

//   private treeToIndexesMap(tree: FileTreeNode): Map<string, number> {
//     const map = new Map<string, number>()
//     let index = 0
//     function buildIndexesMap(item: FileTreeNode) {
//       if (!item.children) {
//         map.set(`${Env.VIDEOS_PATH}${item.path}`, index)
//         index++
//       } else
//         for (const child of item.children) {
//           buildIndexesMap(child)
//         }
//     }
//     buildIndexesMap(tree)
//     return map
//   }

//   getPathIndexes(paths: string[]): number[] {
//     const indexes: number[] = []
//     for (const path of paths) {
//       const index = this.pathIndexesMap.get(path)
//       if (index !== undefined) indexes.push(index)
//     }
//     return indexes
//   }

//   onTreeChange(callback: Function) {
//     this.onTreeChangeCallbacks.push(callback)
//   }

//   async onReady() {
//     if (this._tree) return
//     return new Promise<void>((resolve) => {
//       this.onReadyCallback = resolve
//     })
//   }

//   get tree(): FileTreeNode {
//     if (!this._tree) throw new Error('Tried to get file tree before it was initialized.')
//     return this._tree
//   }
// })()
