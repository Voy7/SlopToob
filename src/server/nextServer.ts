import next from 'next'
import { parse } from 'url'
import { httpServer } from '@/server/httpServer'
import { initializeSocketServer } from '@/server/socket/socket'
import { initializeHlsHandler } from '@/server/hlsHandler'
import Env from '@/server/EnvVariables'
import Logger from '@/server/Logger'
import Checklist from '@/server/Checklist'
import Player from '@/server/stream/Player'
import Thumbnails from '@/server/stream/Thumbnails'
import type { IncomingMessage, ServerResponse } from 'http'

const app = next({
  dev: Env.PROJECT_MODE !== 'production',
  quiet: Env.PROJECT_MODE === 'production',
  port: Env.SERVER_PORT,
  conf: {}
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  Checklist.pass('nextAppReady', 'Next.js app ready.')
  httpServer.on('request', nextRequestHandler)
  initializeSocketServer()
  initializeHlsHandler()
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
      return await Thumbnails.handleThumbnailRequest(req, res, parsedUrl)
    }

    await handle(req, res, parsedUrl)
  } catch (error: any) {
    Logger.error('[Next] Error occurred handling', req.url, error)
    res.statusCode = 500
    res.end('internal server error')
  }
}
