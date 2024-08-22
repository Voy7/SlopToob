import CacheNode from '@/server/stream/CacheNode'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import type { ClientCacheStatus } from '@/typings/socket'

export type CacheDefinition = {
  isVideos: boolean
  dirPath: string
  omitDirs?: () => string[]
}

const cacheDefinitions = {
  videos: {
    isVideos: true,
    dirPath: Env.VIDEOS_OUTPUT_PATH,
    omitDirs: () => {
      let omitDirs: string[] = []
      for (const job of TranscoderQueue.jobs) {
        if (job.video.isBumper) continue
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
        if (!job.video.isBumper) continue
        omitDirs.push(job.video.outputPath)
      }
      return omitDirs
    }
  },
  thumbnails: {
    isVideos: false,
    dirPath: Env.THUMBNAILS_OUTPUT_PATH
  }
} satisfies Record<string, CacheDefinition>

export type CacheID = keyof typeof cacheDefinitions

const MIN_SECONDS_CLIENT_UPDATE = 5

//

const caches = {} as Record<CacheID, CacheNode>
for (const cacheIDKey in cacheDefinitions) {
  const cacheID = cacheIDKey as CacheID
  caches[cacheID] = new CacheNode(cacheID, cacheDefinitions[cacheID])
}

// Main cache handler, manages all cache nodes, singleton
class CacheHandler {
  isCacheID(id: unknown): id is CacheID {
    if (typeof id !== 'string') return false
    return id in cacheDefinitions
  }

  deleteAll(id: CacheID) {
    caches[id].deleteAll()
  }

  getClientCacheStatus(id: CacheID): ClientCacheStatus {
    return caches[id].clientCacheStatus
  }
}

export default new CacheHandler()
