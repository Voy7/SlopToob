import next from 'next'
import { parse } from 'url'
import { httpServer } from '@/server/httpServer'
import { initializeSocketServer } from '@/server/socket'
import { initializeHlsServer } from '@/server/hls'
import { eventRequestHandler } from '@/server/serverEvents'
import Env from '@/EnvVariables'
import type { IncomingMessage, ServerResponse } from 'http'

const app = next({
  dev: process.env.NODE_ENV !== 'production',
  hostname: Env.SERVER_HOST,
  port: Env.SERVER_PORT
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('Next.js server ready')
  httpServer.on('request', nextRequestHandler)
  initializeSocketServer()
  initializeHlsServer()
})

async function nextRequestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!req.url) throw new Error('No url')
    const parsedUrl = parse(req.url, true)

    const wasHandled = await eventRequestHandler(req, res, parsedUrl)
    if (wasHandled) return

    await handle(req, res, parsedUrl)
  }
  catch (error: any) {
    console.error('Error occurred handling', req.url, error)
    res.statusCode = 500
    res.end('internal server error')
  }
}