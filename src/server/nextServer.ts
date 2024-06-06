import next from 'next'
import { parse } from 'url'
import { httpServer } from '@/server/httpServer'
import { initializeSocketServer } from '@/server/socket'
import { initializeHlsServer } from '@/server/hls'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Player from '@/stream/Player'
import Thumbnails from '@/stream/Thumbnails'
import { passCheck, failCheck } from '@/stream/initChecks'
import type { IncomingMessage, ServerResponse } from 'http'

const app = next({
  dev: Env.PROJECT_MODE !== 'production',
  quiet: Env.PROJECT_MODE === 'production',
  port: Env.SERVER_PORT,
  conf: {}
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  passCheck('nextAppReady', 'Next.js app ready.')
  httpServer.on('request', nextRequestHandler)
  initializeSocketServer()
  initializeHlsServer()
  Player.initialize()
})

async function nextRequestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!req.url) throw new Error('No url')
    const parsedUrl = parse(req.url, true)

    // Custom handling for thumbnails
    if (parsedUrl.pathname?.startsWith('/thumbnails/')) {
      return await Thumbnails.handleThumbnailRequest(req, res, parsedUrl)
    }

    await handle(req, res, parsedUrl)
  }
  catch (error: any) {
    Logger.error('[Next] Error occurred handling', req.url, error)
    res.statusCode = 500
    res.end('internal server error')
  }
}