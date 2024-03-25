import { getServerSession } from 'next-auth'
import SessionProvider from '@/contexts/SessionProvider'
import authOptions from '@/lib/authOptions'
import type { Metadata } from 'next'
import '@/app/globals.scss'

import { Ubuntu } from 'next/font/google'
const mainFont = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'SlopToob',
  description: 'WIP by Voy.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={mainFont.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
