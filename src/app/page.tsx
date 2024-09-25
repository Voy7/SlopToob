'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Canvas3D from '@/components/home/3DCanvas'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import Footer from '@/components/layout/Footer'
import styles from './Home.module.scss'

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)

  // Get input from auto-fill password manager
  useEffect(() => {
    if (!inputRef.current) return
    const password = inputRef.current.value
    if (password) setPassword(password)
  }, [inputRef])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || success) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', { password, redirect: false })

      if (!result) return

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess(true)

      // Wait for animation to finish
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Not using Next.js router, due to some weird caching issues
      window.location.href = '/stream'
    } catch (error: unknown) {
      if (!(error instanceof Error)) return
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <>
      <div className={success ? `${styles.home} ${styles.fadeOutAnimation}` : styles.home}>
        <Canvas3D />
        <form onSubmit={submit}>
          <Image src="/logo.png" alt="Logo" width={110} height={110} />
          <h1>
            <span>Slop</span>Toob
          </h1>
          <p className={styles.blurb}>Enter the password to access infinite slop!</p>
          <div className={styles.password}>
            <input
              ref={inputRef}
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              autoFocus
            />
            <Button variant="main" loading={loading} disabled={password.length <= 0} isSubmit>
              Go {'>'}
            </Button>
          </div>
          {error && (
            <p className={styles.error}>
              <Icon name="warning" />
              {error}
            </p>
          )}
        </form>
      </div>
      <Footer />
    </>
  )
}
