'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { useEffect, useMemo, useRef } from 'react'
import Icon from '../ui/Icon'

const prefixColors: Record<string, string> = {
  INFO: 'cyan',
  WARN: 'yellow',
  ERROR: 'red',
  DEBUG: 'magenta'
}

export default function ConsoleLogs() {
  const { logs } = useAdminContext()

  const messagesRef = useRef<HTMLDivElement>(null)

  // When new message is received, scroll to bottom of container if it's already at the bottom
  useEffect(() => {
    const messagesContainer = messagesRef.current
    if (!messagesContainer) return
    console.log(
      'height',
      messagesContainer.scrollHeight,
      messagesContainer.clientHeight,
      messagesContainer.scrollTop
    )
    const isScrolledToBottom =
      messagesContainer.scrollHeight - messagesContainer.clientHeight <=
      messagesContainer.scrollTop + 23

    if (isScrolledToBottom) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }, [logs])

  const parsedLogs = useMemo(() => {
    return logs.map((log, index) => {
      const args = log.split(' ')
      if (args.length < 2) return <>{log}</>
      const timestamp = args[0]
      const prefix = args[1]
      delete args[0]
      delete args[1]
      log = args.join(' ')
      const color = prefixColors[prefix] || 'cyan'
      return (
        <>
          <span className="text-sm text-text3">{timestamp}</span>{' '}
          <span style={{ color }}>{prefix}</span>
          {log}
        </>
      )
    })
  }, [])

  return (
    <div className="overflow-hidden rounded-md border-[1px] border-border1">
      <header className="flex w-full cursor-default items-center justify-between gap-2 bg-bg3 px-1 text-text3">
        <p className="flex items-center gap-1">
          <Icon name="admin-panel" />
          CONSOLE LOGS
        </p>
        <p className="flex items-center gap-1 text-sm">
          <Icon name="list" />
          {logs.length} Logs
        </p>
      </header>
      <div ref={messagesRef} className="h-[20em] w-full overflow-y-scroll bg-black pb-2">
        {parsedLogs.map((log, index) => (
          <div key={index} className="px-2 hover:bg-bg2">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
