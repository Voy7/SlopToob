'use client'

import { signOut } from 'next-auth/react'
import Button from '@/components/ui/Button'

// Auth invalid/expired page component
export default function AuthExpired() {
  function signOutRedirect() {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="flex min-h-[100vh] w-full flex-col items-center justify-center gap-6">
      <img src="/logo.png" alt="" className="h-[100px] grayscale" />
      <p className="flex items-center gap-2 text-lg text-text2">
        Your authentication is invalid or has expired.
      </p>
      <Button variant="main" icon="logout" onClick={signOutRedirect}>
        Sign in Again
      </Button>
    </div>
  )
}
