import { Server } from 'http'
import Env from '@/EnvVariables'
import { passCheck, failCheck } from '@/stream/initChecks'

export const httpServer = new Server()

httpServer.listen(Env.SERVER_PORT, () => {
  passCheck('httpServerReady', `Ready on: http://${Env.SERVER_HOST}:${Env.SERVER_PORT}`)
})

httpServer.once('error', (error) => {
  failCheck('httpServerReady', error.message)
  console.error(error)
})