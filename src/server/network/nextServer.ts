import next from 'next'
import { Server } from 'http'
import { parse } from 'url'
// import { httpServer } from '@/server/network/httpServer'
import { initializeSocketServer } from '@/server/network/socket'
import { initializeHlsHandler } from '@/server/network/hlsHandler'
import Env from '@/server/core/EnvVariables'
import Logger from '@/server/core/Logger'
import Checklist from '@/server/core/Checklist'
import Player from '@/server/stream/Player'
import Thumbnails from '@/server/stream/Thumbnails'
import type { IncomingMessage, ServerResponse } from 'http'

const app = next({
  dev: Env.PROJECT_MODE !== 'production',
  quiet: Env.PROJECT_MODE === 'production',
  port: Env.SERVER_PORT,
  dir: `./src/client`,
  conf: {}
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  Checklist.pass('nextAppReady', 'Next.js app ready.')

  const server = new Server((req, res) => {
    nextRequestHandler(req, res)
  })
  // httpServer.on('request', nextRequestHandler)
  initializeSocketServer(server)
  initializeHlsHandler(server)

  server.listen(Env.SERVER_PORT, () => {
    Checklist.pass('httpServerReady', `Ready on: http://localhost:${Env.SERVER_PORT}`)
  })

  server.once('error', (error) => {
    Checklist.fail('httpServerReady', error.message)
    console.error(error)
  })

  Player.initialize()
})

async function nextRequestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!req.url) throw new Error('No url')
    const parsedUrl = parse(req.url, true)

    // Ignore socket.io requests
    if (parsedUrl.pathname?.startsWith('/socket.io/')) return

    // Custom handling for thumbnails
    if (parsedUrl.pathname?.startsWith('/thumbnails/')) {
      return await Thumbnails.handleVideoThumbnailRequest(req, res, parsedUrl)
    }
    if (parsedUrl.pathname?.startsWith('/playlist-thumbnails/')) {
      return await Thumbnails.handlePlaylistThumbnailRequest(req, res, parsedUrl)
    }

    await handle(req, res, parsedUrl)
  } catch (error: any) {
    Logger.error('[Next] Error occurred handling', req.url, error)
    res.statusCode = 500
    res.end('internal server error')
  }
}
