import fs from 'fs'
import path from 'path'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Settings from '@/server/Settings'
import Video from '@/server/stream/Video'
import PlayHistory from '@/server/stream/PlayHistory'
import SocketUtils from '@/server/socket/SocketUtils'
import { Msg } from '@/lib/enums'
import type { ClientBumper } from '@/typings/socket'

const bumperPaths: string[] = []
let nextBumper: Video | null = null

// Create bumpers directory if it doesn't exist
if (!fs.existsSync(Env.BUMPERS_PATH)) {
  fs.mkdirSync(Env.BUMPERS_PATH, { recursive: true })
}

// Watch bumpers directory for changes
fs.watch(Env.BUMPERS_PATH, { recursive: true }, (_, filename) => {
  if (!filename) return
  syncCheckBumper(path.join(Env.BUMPERS_PATH, filename).replace(/\\/g, '/'))
})

// Add all files in bumpers directory, and populate nextBumper on startup
fs.readdir(Env.BUMPERS_PATH, { recursive: true }, (error, files) => {
  if (error) return Logger.error(`Error reading bumpers directory: ${error.message}`)
  for (const file of files) {
    syncCheckBumper(path.join(Env.BUMPERS_PATH, file.toString()).replace(/\\/g, '/'))
  }
  nextBumper = getRandomBumper()
})

// Handle changes to bumpers directory
function syncCheckBumper(pathName: string) {
  const existingBumper = bumperPaths.find((bumperPath) => bumperPath === pathName)
  const fileExists = fs.existsSync(pathName)

  // File was deleted
  if (!fileExists && existingBumper) {
    bumperPaths.splice(bumperPaths.indexOf(pathName), 1)
    Logger.debug(`Bumper deleted: ${pathName}`)
    SocketUtils.broadcastAdmin(Msg.AdminBumpersList, getClientBumpers())
    return
  }

  // File was added
  if (fileExists && !existingBumper) {
    bumperPaths.push(pathName)
    Logger.debug(`Bumper added: ${pathName}`)
    SocketUtils.broadcastAdmin(Msg.AdminBumpersList, getClientBumpers())
    return
  }

  // ... Handle future cases
}

export function getClientBumpers(): ClientBumper[] {
  return bumperPaths.map((path) => {
    const name = (path.split('/').pop() || 'Unknown').split('.')[0]
    return { path, name }
  })
}

export function getNextBumper(): Video | null {
  if (bumperPaths.length <= 0) return null // No bumpers available

  if (nextBumper) {
    const bumper = nextBumper
    nextBumper = getRandomBumper()
    nextBumper?.prepare()
    return bumper
  }

  nextBumper = getRandomBumper()
  nextBumper?.prepare()

  return getRandomBumper()
}

// TODO: Implement 'smart shuffle' algorithm
function getRandomBumper(): Video | null {
  if (!Settings.bumpersEnabled) return null
  const randomBumper = PlayHistory.getRandom(bumperPaths)
  if (!randomBumper) return null
  const video = new Video(randomBumper, true)
  return video
}

// Bumper settings has changed
export function resyncChanges() {
  if (Settings.bumpersEnabled) {
    nextBumper = getRandomBumper()
    nextBumper?.prepare()
    return
  }
  nextBumper?.end()
  nextBumper = null
}
