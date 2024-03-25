import { ServerEvent } from '@/lib/enums'
import Logger from '@/lib/Logger'
import runEvent from '@/server/runEvent'
import type { IncomingMessage, ServerResponse } from 'http'
import type { UrlWithParsedQuery } from 'url'

// Returns true if the request was handled
export async function eventRequestHandler(req: IncomingMessage, res: ServerResponse, url: UrlWithParsedQuery): Promise<boolean> {
  if (!url.pathname) return false
  const segments = url.pathname.split('/').filter(s => s.length > 0)
  if (segments[0] !== 'server-event') return false
  if (!segments[1]) return false
  const event = parseInt(segments[1]) as ServerEvent | null
  if (event === null) return false

  Logger.debug(`Server event: ${event}`)

  // If event is not in ServerEvent enum, return false
  if (!Object.values(ServerEvent).includes(event)) return false
  

  try {
    await runEvent(event, req, res)
  }
  catch (error: any) {
    res.end(JSON.stringify({ error: error.message }))
  }

  return true
}