import fsAsync from 'fs/promises'
import path from 'path'
import Events from '@/server/socket/Events'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'

// Admin uploads a bumper
// Respond true if successful, string if error
Events.add(Events.Msg.AdminUploadBumper, {
  adminOnly: true,
  run: async (socket, payload: unknown) => {
    try {
      if (!payload || typeof payload !== 'object') throw new Error('Invalid payload.')
      if (!('name' in payload) || typeof payload.name !== 'string')
        throw new Error('Invalid payload.')
      if (!('videoFile' in payload) || typeof payload.videoFile !== 'string')
        throw new Error('No video selected.')
      if (payload.name.length <= 0) throw new Error('Bumper title cannot be empty.')

      const bumperExt = payload.videoFile.split(';base64,')[0].split('/')[1]
      const bumperName = `${payload.name}.${bumperExt}`
      const bumperPath = path.join(Env.BUMPERS_PATH, bumperName)
      const bumperExists = await fsAsync
        .access(bumperPath)
        .then(() => true)
        .catch(() => false)
      if (bumperExists) throw new Error('Bumper with that name already exists.')

      const base64 = payload.videoFile.split(';base64,').pop()
      if (!base64) throw new Error('Invalid base64 data.')
      await fsAsync.writeFile(bumperPath, base64, { encoding: 'base64' })
      socket.emit(Events.Msg.AdminUploadBumper, true)
    } catch (error: any) {
      socket.emit(Events.Msg.AdminUploadBumper, error.message)
    }
  }
})
// Admin deletes a bumper
// Respond true if successful, string if error
Events.add(Events.Msg.AdminDeleteBumper, {
  adminOnly: true,
  run: async (socket, filePath: string) => {
    try {
      if (!filePath.startsWith(Env.BUMPERS_PATH))
        throw new Error('File is not in bumpers directory.')
      await fsAsync.rm(filePath)
      Logger.debug(`Admin requested deleted bumper: ${filePath}`)
      socket.emit(Events.Msg.AdminDeleteBumper, true)
    } catch (error: any) {
      socket.emit(Events.Msg.AdminDeleteBumper, error.message)
    }
  }
})
