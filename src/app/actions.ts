'use server'

import { cookies } from 'next/headers'
import { doServerEvent, ServerEvent } from '@/lib/doServerEvent'
// import { ServerEvent } from '@/lib/enums'
import Env from '@/EnvVariables'

// import { io, viewers  } from '@/server/socket'
// import { SocketEvent } from '@/lib/enums'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import type { ActionResponse } from '@/typings/types'

export async function changeNickname(nickname: string, socketSecret: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions)
    const authUser = session?.user
    if (!authUser) throw new Error('You are not authenticated.')

    // Username can only have alphanumeric characters, spaces, and underscores
    if (!/^[a-zA-Z0-9_ ]+$/.test(nickname)) {
      throw new Error('Username can only contain alphanumeric characters.')
    }
    
    cookies().set('nickname', nickname, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'strict',
      secure: false
    })

    return doServerEvent(ServerEvent.ChangeUsername, { username: nickname, socketSecret })
  }
  catch (error: any) {
    return { error: error.message }
  }
}

export async function sendChatMessage(message: string, socketSecret: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions)
    const authUser = session?.user
    if (!authUser) throw new Error('You are not authenticated.')

    if (message.length === 0) throw new Error('Message cannot be empty.')

    return doServerEvent(ServerEvent.SendChatMessage, { message, socketSecret })
  }
  catch (error: any) {
    return { error: error.message }
  }
}