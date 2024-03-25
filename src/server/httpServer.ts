import { Server } from 'http'
import Env from '@/EnvVariables'

export const httpServer = new Server()

httpServer.once('error', (err) => {
  console.error(err)
  process.exit(1)
})

httpServer.listen(Env.SERVER_PORT, () => {
  console.log(`> Ready on http://${Env.SERVER_HOST}:${Env.SERVER_PORT}`)
})