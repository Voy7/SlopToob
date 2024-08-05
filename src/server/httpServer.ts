import { Server } from 'http'
import Env from '@/server/EnvVariables'
import Checklist from '@/server/Checklist'

export const httpServer = new Server()

httpServer.listen(Env.SERVER_PORT, () => {
  Checklist.pass('httpServerReady', `Ready on: http://localhost:${Env.SERVER_PORT}`)
})

httpServer.once('error', (error) => {
  Checklist.fail('httpServerReady', error.message)
  console.error(error)
})
