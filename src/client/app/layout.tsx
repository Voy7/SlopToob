import { getServerSession } from 'next-auth'
import SessionProvider from '@/contexts/SessionProvider'
import authOptions from '@/authOptions'
import type { Metadata } from 'next'
import '@/app/globals.scss'
import '@/app/animations.scss'

import { Roboto } from 'next/font/google'
const mainFont = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700']
})

export const metadata: Metadata = {
  title: 'SlopToob',
  description: 'Enjoy a 24/7 live stream of the highest quality slop content.'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="/logo.png" />
        <meta name="theme-color" content="#5496ff" />
        <link rel="preload" href="/logo.png" as="image" />
      </head>
      <body className={mainFont.className}>
        <SessionProvider session={session}>
          {children}
          <div id="modals-root" className="relative z-10" />
        </SessionProvider>
      </body>
    </html>
  )
}
