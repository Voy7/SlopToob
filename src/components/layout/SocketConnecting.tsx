'use client'

import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { twMerge } from 'tailwind-merge'

type Props = {
  state: 'connecting' | 'failed' | 'auth-failed'
  retry?: Function
}

export default function SocketConnecting({ state, retry }: Props) {
  return (
    <div className="flex min-h-[100vh] w-full flex-col items-center justify-center gap-8">
      <img src="/logo.png" alt="Logo" className="h-[100px]" />
      <p
        key={state}
        className={twMerge(
          'animate-fade-in flex items-center gap-2 text-lg',
          retry ? 'text-red-500' : 'text-text2'
        )}>
        {state === 'connecting' && (
          <>
            <Icon name="loading" className="text-text3" />
            Connecting...
          </>
        )}
        {state === 'failed' && (
          <>
            <Icon name="warning" />
            Could not connect to server.
          </>
        )}
        {state === 'auth-failed' && (
          <>
            <Icon name="warning" />
            Authentication failed.
          </>
        )}
      </p>
      <div className={retry ? undefined : 'invisible'}>
        <Button icon="refresh" variant="normal" onClick={() => retry?.()}>
          Retry
        </Button>
      </div>
    </div>
  )
}
