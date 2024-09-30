'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../ui/Icon'

const prefixColors: Record<string, string> = {
  INFO: 'cyan',
  WARN: 'yellow',
  ERROR: 'red',
  DEBUG: 'magenta',
  CHAT: 'blue'
}

export default function ConsoleLogs() {
  const { logs } = useAdminContext()

  const [isAtBottom, setIsAtBottom] = useState<boolean>(true)

  const messagesRef = useRef<HTMLDivElement>(null)

  // When new message is received, scroll to bottom of container if it's already at the bottom
  useEffect(() => {
    if (!isAtBottom) return
    setTimeout(() => {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }, 50)
  }, [logs, isAtBottom])

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
  }, [logs])

  return (
    <div className="h-[350px] rounded-md">
      <header className="flex w-full cursor-default items-center justify-between gap-2 bg-bg2 px-1 text-text3">
        <p className="flex items-center gap-1">
          <Icon name="admin-panel" />
          CONSOLE LOGS
        </p>
        <p className="flex items-center gap-1 text-sm">
          <Icon name="list" />
          {logs.length} Logs
        </p>
      </header>
      <div
        ref={messagesRef}
        className="h-full w-full overflow-y-scroll border border-border1 bg-black pb-2"
        onScroll={() => {
          if (!messagesRef.current) return
          console.log(
            messagesRef.current.scrollHeight,
            messagesRef.current.scrollTop,
            messagesRef.current.clientHeight
          )
          setIsAtBottom(
            messagesRef.current.scrollHeight - messagesRef.current.clientHeight <=
              messagesRef.current.scrollTop
          )
        }}>
        {parsedLogs.map((log, index) => (
          <div key={index} className="px-2 hover:bg-bg2">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
