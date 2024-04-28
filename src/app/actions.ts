'use server'

import { cookies } from 'next/headers'

export async function setNicknameCookie(name: string) {
  cookies().set('nickname', name, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'strict',
    secure: false
  })
}