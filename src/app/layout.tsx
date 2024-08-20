import { getServerSession } from 'next-auth'
import SessionProvider from '@/contexts/SessionProvider'
import authOptions from '@/lib/authOptions'
import Footer from '@/components/layout/Footer'
import type { Metadata } from 'next'
import '@/app/globals.scss'
import '@/app/animations.scss'

import { Roboto } from 'next/font/google'
const mainFont = Roboto({
  subsets: ['latin'],
  weight: ['400', '700']
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
      </head>
      <body className={mainFont.className}>
        <SessionProvider session={session}>
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
