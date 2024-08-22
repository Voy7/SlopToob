import fs from 'fs'
import bytesToSize from '@/lib/bytesToSize'
import FsWatcher from '@/server/FsWatcher'
import Logger from '@/server/Logger'
import SocketUtils from '@/server/socket/SocketUtils'
import { Msg } from '@/lib/enums'
import type { CacheDefinition, CacheID } from '@/server/stream/CacheHandler'
import type { ClientCacheStatus } from '@/typings/socket'

const MIN_SECONDS_CLIENT_UPDATE = 5

// Individual cache nodess
export default class CacheNode {
  readonly id: CacheID
  readonly definition: CacheDefinition
  totalBytes: number = 0
  totalItems: number = 0
  isDeleting: boolean = false

  private fileSizes: Map<string, number> = new Map() // Value = file size in bytes
  private lastClientUpdateTime: number = 0
  private isClientUpdatePending: boolean = false

  constructor(id: CacheID, definiton: CacheDefinition) {
    this.id = id
    this.definition = definiton

    this.initialize()
  }

  async initialize() {
    const startTime = Date.now()

    if (!fs.existsSync(this.definition.dirPath))
      fs.mkdirSync(this.definition.dirPath, { recursive: true })

    const watcher = new FsWatcher(this.definition.dirPath)

    let firstEmit = true
    watcher.onNewFile((filePath) => {
      if (firstEmit) {
        const stats = fs.statSync(filePath)
        this.totalBytes += stats.size
        this.totalItems++
        this.fileSizes.set(filePath, stats.size)
        this.broadcastClientUpdate()
        return
      }
      this.totalItems++
      this.fileSizes.set(filePath, 0)
      setTimeout(() => {
        if (!this.fileSizes.has(filePath)) return
        const stats = fs.statSync(filePath)
        this.totalBytes += stats.size
        this.fileSizes.set(filePath, stats.size)
        this.broadcastClientUpdate()
      }, 1000) // Wait 1s before checking file size
    })

    watcher.onDeleteFile((filePath) => {
      console.log('delete file', filePath)
      if (!this.fileSizes.has(filePath)) return
      const size = this.fileSizes.get(filePath) as number
      this.totalBytes -= size
      this.totalItems--
      this.fileSizes.delete(filePath)
      this.broadcastClientUpdate()
    })

    await watcher.emitAllCurrentFiles()
    firstEmit = false

    watcher.activate()

    const passedSeconds = ((Date.now() - startTime) / 1000).toFixed(3)
    Logger.debug(
      `[CacheNode] Initialized cache ${this.id} with ${this.totalItems.toLocaleString()} files and ${bytesToSize(this.totalBytes)} in ${passedSeconds}s.`
    )
  }

  private broadcastClientUpdate() {
    if (this.isClientUpdatePending) return
    const lastUpdateSeconds = (Date.now() - this.lastClientUpdateTime) / 1000
    if (lastUpdateSeconds < MIN_SECONDS_CLIENT_UPDATE) {
      this.isClientUpdatePending = true
      setTimeout(
        () => {
          this.isClientUpdatePending = false
          this.broadcastClientUpdate()
        },
        (MIN_SECONDS_CLIENT_UPDATE - lastUpdateSeconds) * 1000
      )
    }

    this.lastClientUpdateTime = Date.now()
    SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, this.clientCacheStatus)
  }

  async deleteAll() {
    // Delete all files in the cache directory
    if (this.isDeleting) return
    this.isDeleting = true
    SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, this.clientCacheStatus)

    const startTime = Date.now()

    if (this.definition.isVideos) {
      const omitDirs = this.definition.omitDirs?.() || []
      const dirs: string[] = []
      this.fileSizes.forEach((size, file) => {
        const dir = file.split('/').slice(0, -1).join('/')
        console.log(dir, omitDirs)
        if (dirs.includes(dir)) return
        if (omitDirs.includes(dir)) return
        dirs.push(dir)
      })

      let deleteCount = 0
      for (const dir of dirs) {
        fs.rm(dir, { recursive: true, force: true }, (error) => {
          if (error) Logger.error(`[CacheNode] Error deleting cache dir: ${dir}`, error)
          deleteCount++
          if (deleteCount !== dirs.length) return
          this.isDeleting = false
          SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, this.clientCacheStatus)
          const passedSeconds = ((Date.now() - startTime) / 1000).toFixed(2)
          Logger.debug(
            `[CacheNode] Deleted ${dirs.length} directories in ${this.id} cache in ${passedSeconds}s.`
          )
        })
      }
      return
    }

    let deleteCount = 0
    this.fileSizes.forEach((size, file) => {
      fs.rm(file, { force: true }, (error) => {
        if (error) Logger.error(`[CacheNode] Error deleting cache file: ${file}`, error)
        deleteCount++
        if (deleteCount !== this.fileSizes.size) return
        this.isDeleting = false
        SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, this.clientCacheStatus)
        const passedSeconds = ((Date.now() - startTime) / 1000).toFixed(2)
        Logger.debug(
          `[CacheNode] Deleted ${deleteCount} files in ${this.id} cache in ${passedSeconds}s.`
        )
      })
    })
  }

  get clientCacheStatus(): ClientCacheStatus {
    if (this.definition.isVideos) {
      const omitDirs = this.definition.omitDirs?.() || []
      let totalBytes = this.totalBytes
      let totalItems = this.totalItems
      const dirs: string[] = []
      this.fileSizes.forEach((size, file) => {
        const dir = file.split('/').slice(0, -1).join('/')
        if (!omitDirs.includes(dir)) return
        if (!dirs.includes(dir)) dirs.push(dir)
        totalBytes -= size
        totalItems--
      })

      return {
        cacheID: this.id,
        fileCount: totalItems,
        videosCount: dirs.length,
        size: bytesToSize(totalBytes),
        isDeleting: this.isDeleting
      }
    }

    return {
      cacheID: this.id,
      fileCount: this.totalItems,
      size: bytesToSize(this.totalBytes),
      isDeleting: this.isDeleting
    }
  }
}
