import Env from '@/EnvVariables'
import { ServerEvent } from '@/lib/enums'
import type { ActionResponse } from '@/typings/types'

export { ServerEvent }

export async function doServerEvent(event: ServerEvent, payload: any): Promise<ActionResponse> {
  try {
    const response = await fetch(`http://${Env.SERVER_HOST}:${Env.SERVER_PORT}/server-event/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await response.json() as ActionResponse

    if ('error' in data) throw new Error(data.error)

    return { success: true }
  }
  catch (error: any) {
    return { error: error.message }
  }
}