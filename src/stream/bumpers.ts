import fs from 'fs'
import path from 'path'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import SocketUtils from '@/lib/SocketUtils'
import { SocketEvent } from '@/lib/enums'
import type { ClientVideo } from '@/typings/types'

export const bumpers: Video[] = []
export let nextBumper: Video | null = null

// Create bumpers directory if it doesn't exist
if (!fs.existsSync(Env.BUMPERS_PATH)) {
  fs.mkdirSync(Env.BUMPERS_PATH, { recursive: true })
}

// Watch bumpers directory for changes
fs.watch(Env.BUMPERS_PATH, { recursive: true }, (_, filename) => {
  if (!filename) return
  syncCheckBumper(path.join(Env.BUMPERS_PATH, filename))
})

// Add all files in bumpers directory, and populate nextBumper on startup
fs.readdir(Env.BUMPERS_PATH, { recursive: true }, (error, files) => {
  if (error) return Logger.error(`Error reading bumpers directory: ${error.message}`)
  for (const file of files) { syncCheckBumper(path.join(Env.BUMPERS_PATH, file.toString())) }
  queueNextBumper()
})

// Handle changes to bumpers directory
function syncCheckBumper(pathName: string) {
  const existingBumper = bumpers.find(bumper => bumper.path === pathName)
  const fileExists = fs.existsSync(pathName)

  // File was deleted
  if (!fileExists && existingBumper) {
    bumpers.splice(bumpers.indexOf(existingBumper), 1)
    Logger.debug(`Bumper deleted: ${pathName}`)
    SocketUtils.broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
    return
  }

  // File was added
  if (fileExists && !existingBumper) {
    const video = new Video(pathName, true)
    bumpers.push(video)
    Logger.debug(`Bumper added: ${pathName}`)
    SocketUtils.broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
    return
  }

  // ... Handle future cases
}

// Utility function to get all bumpers as ClientVideo[] for client side
export function getClientBumpers(): ClientVideo[] {
  return bumpers.map(bumper => bumper.clientVideo)
}

// Prepare the next bumper to be played
export function queueNextBumper(): Video | null {
  if (!bumpers.length) return null // No bumpers available

  // Randomly select a bumper
  nextBumper = bumpers[Math.floor(Math.random() * bumpers.length)]
  nextBumper.prepare()
  return nextBumper
}