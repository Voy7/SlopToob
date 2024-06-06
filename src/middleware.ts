import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

process.env.NEXTAUTH_URL = process.env.SERVER_URL
process.env.NEXTAUTH_SECRET = process.env.SECRET_KEY

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const token = await getToken({ req })
  const isAuthenticated = !!token

  if (req.nextUrl.pathname == '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/stream', req.url))
  }

  if (req.nextUrl.pathname.startsWith('/stream')) {
    const authMiddleware = await withAuth({
      pages: {
        signIn: '/'
      }
    })
  
    return authMiddleware(req as any, event)
  }
}