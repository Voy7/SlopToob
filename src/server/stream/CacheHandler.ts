import path from 'path'
import fs from 'fs'
import fsAsync from 'fs/promises'
import bytesToSize from '@/lib/bytesToSize'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import FsWatcher from '@/server/FsWatcher'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import SocketUtils from '@/server/socket/SocketUtils'
import { Msg } from '@/lib/enums'
import type { ClientCacheStatus } from '@/typings/socket'

type CacheDefinition = {
  [key: string]: {
    isVideos: boolean
    dirPath: string
    omitDirs?: () => string[]
  }
}

const cacheDefinitions = {
  videos: {
    isVideos: true,
    dirPath: Env.VIDEOS_OUTPUT_PATH,
    omitDirs: () => {
      let omitDirs: string[] = []
      for (const job of TranscoderQueue.jobs) {
        omitDirs.push(job.video.outputPath)
      }
      return omitDirs
    }
  },
  bumpers: {
    isVideos: true,
    dirPath: Env.BUMPERS_OUTPUT_PATH,
    omitDirs: () => {
      let omitDirs: string[] = []
      for (const job of TranscoderQueue.jobs) {
        omitDirs.push(job.video.outputPath)
      }
      return omitDirs
    }
  },
  thumbnails: {
    isVideos: false,
    dirPath: Env.THUMBNAILS_OUTPUT_PATH
  }
} satisfies CacheDefinition

export type CacheID = keyof typeof cacheDefinitions

const MIN_SECONDS_CLIENT_UPDATE = 5

// Individual cache nodess
class CacheNode {
  id: CacheID
  isVideos: boolean
  dirPath: string
  totalBytes: number = 0
  totalItems: number = 0
  isDeleting: boolean = false
  private fileSizes: Map<string, number> = new Map()
  private lastClientUpdateTime: number = 0
  private isClientUpdatePending: boolean = false

  constructor(id: CacheID, definiton: CacheDefinition[CacheID]) {
    this.id = id
    this.isVideos = definiton.isVideos
    this.dirPath = definiton.dirPath

    this.initialize()
  }

  async initialize() {
    const startTime = Date.now()

    if (!fs.existsSync(this.dirPath)) fs.mkdirSync(this.dirPath, { recursive: true })

    const watcher = new FsWatcher(this.dirPath)

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
      `[CacheNode] Initialized cache ${this.id} with ${this.totalItems} files and ${this.totalBytes} bytes in ${passedSeconds}s.`
    )
  }

  broadcastClientUpdate() {
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
    SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, CacheHandler.getClientCacheStatus(this.id))
  }

  deleteAll() {
    // Delete all files in the cache directory
    if (this.isDeleting) return
    this.isDeleting = true
    SocketUtils.broadcastAdmin(Msg.AdminCacheStatus, CacheHandler.getClientCacheStatus(this.id))
  }
}

const caches = {} as Record<CacheID, CacheNode>
for (const cacheIDKey in cacheDefinitions) {
  const cacheID = cacheIDKey as CacheID
  caches[cacheID] = new CacheNode(cacheID, cacheDefinitions[cacheID])
}

// Main cache handler, manages all cache nodes
class CacheHandlerClass {
  isCacheID(id: unknown): id is CacheID {
    if (typeof id !== 'string') return false
    return id in cacheDefinitions
  }

  deleteAll(id: CacheID) {
    caches[id].deleteAll()
  }

  getClientCacheStatus(id: CacheID): ClientCacheStatus {
    const cache = caches[id]
    return {
      cacheID: id,
      filesCount: cache.totalItems,
      size: bytesToSize(cache.totalBytes),
      isDeleting: cache.isDeleting
    }
  }
}

const CacheHandler = new CacheHandlerClass()

export default CacheHandler
