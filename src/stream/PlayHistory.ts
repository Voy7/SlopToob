import prisma from '@/lib/prisma'
import parseVideoName from '@/lib/parseVideoName'
import parseTimestamp from '@/lib/parseTimestamp'
import Env from '@/EnvVariables'
import Logger from '@/server/Logger'
import Settings from '@/stream/Settings'
import Player from '@/stream/Player'
import TranscoderQueue from '@/stream/TranscoderQueue'
import Thumbnails from '@/stream/Thumbnails'
import SocketUtils from '@/lib/SocketUtils'
import { Msg } from '@/lib/enums'
import type { PlayHistory as DBPlayHistory } from '@prisma/client'
import type { ClientHistoryItem, ClientHistoryStatus } from '@/typings/socket'
import type Video from '@/stream/Video'

// Video history handler
export default new class PlayHistory {
  private internalHistory: string[] = []
  private displayHistory: DBPlayHistory[] = []
  private isDeleting: boolean = false

  constructor() { this.populateHistory() }

  // Populate history with last N videos
  private async populateHistory() {
    // Get last N videos from history
    const history = await prisma.playHistory.findMany({
      where: { isDeleted: false },
      take: Math.max(Settings.historyMaxItems, Settings.historyDisplayItems),
      orderBy: { createdAt: 'desc' }
    })

    this.internalHistory = history.map(h => h.path)

    this.displayHistory = history
      .filter(h => Settings.historyDisplayBumpers || !h.path.startsWith(Env.BUMPERS_PATH))
      .slice(0, Settings.historyDisplayItems + 1)

    Logger.debug(`[History] Populated history with ${this.internalHistory.length} items.`)
  }

  // Add a video path to the history
  async add(video: Video) {
    this.internalHistory.unshift(video.inputPath)
    
    if (this.internalHistory.length > Settings.historyMaxItems) {
      this.internalHistory.pop()
    }

    const newEntry = await prisma.playHistory.create({
      data: { path: video.inputPath, totalDuration: video.durationSeconds }
    })

    if (Settings.historyDisplayBumpers || !video.inputPath.startsWith(Env.BUMPERS_PATH)) {
      if (this.displayHistory.length >= Settings.historyDisplayItems) {
        this.displayHistory.pop()
      }
      this.displayHistory.unshift(newEntry)
    }

    SocketUtils.broadcastAdmin(Msg.AdminHistoryStatus, this.clientHistoryStatus)

    Logger.debug(`[History] Added ${video.inputPath} to history.`)
  }

  // Get a random video path from the supplied list of paths if it is not in the history
  // If all paths are in history, history is weighted by lowest amount of times played
  // Will also take all videos in queue into account
  getRandom(inputPaths: string[]): string | null {
    if (inputPaths.length == 0) return null

    // Remove duplicates from inputPaths
    inputPaths = [...new Set(inputPaths)]

    // Use history AND queue items for algorithm
    const historyItems = [...this.internalHistory, ...TranscoderQueue.jobs.map(j => j.video.inputPath)]

    // Count how many times each item has been played
    const countMap = new Map<string, number>()
    for (const item of historyItems) {
      if (!inputPaths.includes(item)) continue
      const existing = countMap.get(item)
      if (existing) countMap.set(item, existing + 1)
      else countMap.set(item, 1)
    }

    // Get the lowest amount of times played
    let minCount = 0
    if (countMap.size >= inputPaths.length) {
      minCount = Infinity
      countMap.forEach(count => {
        if (count < minCount) minCount = count
      })
    }

    // Pool is all inputPaths 
    const pool: string[] = []
    for (const path of inputPaths) {
      const playCount = countMap.get(path)
      if (!playCount || playCount === minCount) pool.push(path)
    }

    // If pool is empty, return null
    if (pool.length === 0) return null

    // Return a random item from the pool
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Sync new display history settings
  async resyncChanges() {
    await this.populateHistory()
    SocketUtils.broadcast(Msg.StreamInfo, Player.clientStreamInfo)
    SocketUtils.broadcastAdmin(Msg.AdminHistoryStatus, this.clientHistoryStatus)
  }

  async clearAllHistory() {
    if (this.isDeleting) return
    this.isDeleting = true
    SocketUtils.broadcastAdmin(Msg.AdminHistoryStatus, this.clientHistoryStatus)
    await prisma.playHistory.updateMany({ data: { isDeleted: true } })
    await this.populateHistory()
    this.isDeleting = false
    SocketUtils.broadcastAdmin(Msg.AdminHistoryStatus, this.clientHistoryStatus)
  }

  get clientHistory(): ClientHistoryItem[] | null {
    if (!Settings.historyDisplayEnabled) return null

    // Don't include the current video
    const items = Player.playing?.inputPath === this.displayHistory[0]?.path
      ? this.displayHistory.slice(1)
      : this.displayHistory.slice(0, Settings.historyDisplayItems)
    return  items.map(item => ({
      name: parseVideoName(item.path),
      totalDuration: parseTimestamp(item.totalDuration),
      thumbnailURL: Thumbnails.getURL(item.path),
      isBumper: item.path.startsWith(Env.BUMPERS_PATH)
    }))
  }

  get clientHistoryStatus(): ClientHistoryStatus {
    return {
      currentCount: this.internalHistory.length,
      totalCount: Settings.historyMaxItems,
      isDeleting: this.isDeleting
    }
  }
}