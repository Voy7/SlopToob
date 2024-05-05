import prisma from '@/lib/prisma'
import Logger from '@/lib/Logger'
import Settings from '@/stream/Settings'
import TranscoderQueue from '@/stream/TranscoderQueue'

// Video history handler
export default new class PlayHistory {
  private history: string[] = []

  constructor() { this.populateHistory() }

  // Populate history with last N videos
  async populateHistory() {
    const { historyMaxItems } = Settings.getSettings()

    // Get last N videos from history
    const history = await prisma.playHistory.findMany({
      take: historyMaxItems,
      orderBy: { createdAt: 'desc' }
    })

    this.history = history.map(h => h.path)
    Logger.debug(`[History] Populated history with ${this.history.length} items.`)
  }

  // Add a video path to the history
  add(inputPath: string) {
    if (this.history.includes(inputPath)) return

    this.history.unshift(inputPath)
    
    if (this.history.length > Settings.getSettings().historyMaxItems) {
      this.history.pop()
    }

    prisma.playHistory.create({ data: { path: inputPath } })
    Logger.debug(`[History] Added ${inputPath} to history.`)
  }

  // Get a random video path from the supplied list of paths if it is not in the history
  // If all paths are in history, history is ignored and a random path is returned
  // Will also take all videos in queue into account
  getRandom(inputPaths: string[]): string | null {
    if (inputPaths.length === 0) return null

    const notInHistory = inputPaths.filter(p => {
      if (this.history.includes(p)) return false
      if (TranscoderQueue.jobs.some(j => j.video.inputPath === p)) return false
      return true
    })

    // No 'new' videos, return random
    if (notInHistory.length === 0) return inputPaths[Math.floor(Math.random() * inputPaths.length)]

    // Return random from 'new' videos
    return notInHistory[Math.floor(Math.random() * notInHistory.length)]
  }
}