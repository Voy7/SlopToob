import fs from 'fs'
import path from 'path'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Video from '@/stream/Video'
import { broadcastAdmin } from '@/server/socket'
import { SocketEvent } from '@/lib/enums'
import type { ClientVideo } from '@/typings/types'

export const bumpers: Video[] = []

// Watch bumpers directory for changes
fs.watch(Env.BUMPERS_PATH, { recursive: true }, (event, filename) => {
  if (!filename) return
  syncCheckBumper(path.join(Env.BUMPERS_PATH, filename))
})

// Add all files in bumpers directory on startup
fs.readdir(Env.BUMPERS_PATH, { recursive: true }, (error, files) => {
  if (error) return Logger.error(`Error reading bumpers directory: ${error.message}`)
  for (const file of files) { syncCheckBumper(path.join(Env.BUMPERS_PATH, file.toString())) }
})

function syncCheckBumper(pathName: string) {
  const existingBumper = bumpers.find(bumper => bumper.path === pathName)
  const fileExists = fs.existsSync(pathName)

  // File was deleted
  if (!fileExists && existingBumper) {
    bumpers.splice(bumpers.indexOf(existingBumper), 1)
    Logger.debug(`Bumper deleted: ${pathName}`)
    broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
    return
  }

  // File was added
  if (fileExists && !existingBumper) {
    const video = new Video(pathName, true)
    bumpers.push(video)
    Logger.debug(`Bumper added: ${pathName}`)
    broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
    return
  }

  // ... Handle future cases
}

// Utility function to get all bumpers as ClientVideo[] for client side
export function getClientBumpers(): ClientVideo[] {
  return bumpers.map(bumper => ({ path: bumper.path, name: bumper.name }))
}