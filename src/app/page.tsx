'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from './Home.module.scss'

export default function Home() {
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // const router = useRouter()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const result = await signIn('credentials', { password, redirect: false })
      
      if (!result) return

      if (result.error) {
        throw new Error(result.error)
      }

      // Not using Next.js router, due to some weird caching issues
      window.location.href = '/stream'
    }
    catch (error: unknown) {
      if (!(error instanceof Error)) return
      setError(error.message)
    }
  }

  return (
    <div className={styles.home}>
      <form onSubmit={submit}>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button type="submit">Submit</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}