import prisma from '@/lib/prisma'
import parseVideoName from '@/lib/parseVideoName'
import parseTimestamp from '@/lib/parseTimestamp'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Settings from '@/stream/Settings'
import Player from '@/stream/Player'
import TranscoderQueue from '@/stream/TranscoderQueue'
import Thumbnails from '@/stream/Thumbnails'
import type { PlayHistory as DBPlayHistory } from '@prisma/client'
import type { ClientHistoryItem } from '@/typings/socket'
import type Video from '@/stream/Video'

// How many items to show for client history
const MAX_RECENT_ITEMS = 5

// Video history handler
export default new class PlayHistory {
  private history: string[] = []
  private recent: DBPlayHistory[] = []

  constructor() { this.populateHistory() }

  // Populate history with last N videos
  private async populateHistory() {
    // Get last N videos from history
    const history = await prisma.playHistory.findMany({
      take: Settings.historyMaxItems,
      orderBy: { createdAt: 'desc' }
    })

    this.history = history.map(h => h.path)
    this.recent = history.slice(0, MAX_RECENT_ITEMS + 1)

    Logger.debug(`[History] Populated history with ${this.history.length} items.`)
  }

  // Add a video path to the history
  async add(video: Video) {
    this.history.unshift(video.inputPath)
    
    if (this.history.length > Settings.historyMaxItems) {
      this.history.pop()
    }

    if (this.recent.length > MAX_RECENT_ITEMS + 1) {
      this.recent.pop()
    }

    const newEntry = await prisma.playHistory.create({
      data: { path: video.inputPath, totalDuration: video.durationSeconds }
    })
    this.recent.unshift(newEntry)

    Logger.debug(`[History] Added ${video.inputPath} to history.`)
  }

  // Get a random video path from the supplied list of paths if it is not in the history
  // If all paths are in history, history is weighted by lowest amount of times played
  // Will also take all videos in queue into account
  getRandom(inputPaths: string[]): string | null {
    if (inputPaths.length == 0) return null

    // Use history AND queue items for algorithm
    const historyItems = [...this.history, ...TranscoderQueue.jobs.map(j => j.video.inputPath)]

    // Count how many times each item has been played
    const countMap = new Map<string, number>()
    for (const item of historyItems) {
      if (!inputPaths.includes(item)) continue
      const existing = countMap.get(item)
      if (existing) countMap.set(item, existing + 1)
      else countMap.set(item, 1)
    }

    // Get the lowest amount of times played
    let minCount = Infinity
    countMap.forEach(count => {
      if (count < minCount) minCount = count
    })

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

  get clientHistory(): ClientHistoryItem[] {
    // Don't include the current video
    const items = Player.playing?.inputPath === this.recent[0]?.path
      ? this.recent.slice(1)
      : this.recent.slice(0, MAX_RECENT_ITEMS)
    return  items.map(item => ({
      name: parseVideoName(item.path),
      totalDuration: parseTimestamp(item.totalDuration),
      thumbnailURL: Thumbnails.getURL(item.path),
      isBumper: item.path.startsWith(Env.BUMPERS_PATH)
    }))
  }
}