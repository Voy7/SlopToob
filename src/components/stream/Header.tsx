'use client'

import { useSession, signOut } from 'next-auth/react'
import { AuthRole } from '@/lib/enums'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import HeaderAdminOptions from '@/components/stream/HeaderAdminOptions'

// Stream header component
export default function Header() {
  const session = useSession()
  const authUser = session.data?.user

  return (
    <header className="flex h-[var(--header-height)] w-full items-center justify-between gap-4 overflow-x-auto overflow-y-hidden border-b border-black bg-bg2 p-2 shadow-md">
      <Link href="/home" className="text-decoration-none flex shrink-0 items-center gap-2">
        <Image src="/logo.png" alt="Logo" width={30} height={30} />
        <h1 className="text-xl font-bold">
          <span className="text-[var(--logo-color-1)]">Slop</span>Toob
        </h1>
      </Link>
      <div className="flex flex-shrink-0 items-center gap-4">
        {authUser && authUser.role >= AuthRole.Admin && <HeaderAdminOptions />}
        <Button
          variant="normal"
          icon="logout"
          onClick={() => signOut()}
          className="hover:border-red-500 hover:bg-red-500">
          Sign Out
        </Button>
      </div>
    </header>
  )
}
