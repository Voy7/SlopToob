'use client'

import { useState, useEffect, useRef } from 'react'
import Icon, { IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'
import { createPortal } from 'react-dom'

type Props = {
  title: string
  subtitle: string
  icon: IconNames
  children: React.ReactNode
}

// Custom dropdown element
export default function HeaderAdminDropdown({ title, subtitle, icon, children }: Props) {
  const [open, setOpen] = useState(false)
  const [left, setLeft] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return

    const RIGHT_PADDING = 24
    const containerRect = containerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    const totalWidth = contentRect.left + contentRect.width
    if (totalWidth > window.innerWidth - RIGHT_PADDING)
      setLeft(window.innerWidth - contentRect.width - RIGHT_PADDING)
    else setLeft(containerRect.left)

    function close(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    window.addEventListener('click', close)

    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <div
      ref={containerRef}
      className="relative h-[var(--header-height)] w-[200px]"
      onClick={() => setOpen(!open)}>
      <button
        className={twMerge(
          'flex h-full w-full items-center justify-between gap-1 border border-border1 p-2 text-lg',
          open ? 'bg-bg3' : 'hover:bg-bg3'
        )}>
        <div className="flex items-center gap-1 overflow-hidden">
          {icon && <Icon name={icon} className="shrink-0" />}
          <div className="flex h-full flex-col overflow-hidden">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">
              {title}
            </span>
            <span className="mt-[-0.5rem] w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm text-text3">
              {subtitle}
            </span>
          </div>
        </div>
        <Icon name="down-chevron" className="shrink-0" />
      </button>
      {createPortal(
        <div
          ref={contentRef}
          className={twMerge(
            'absolute top-[var(--header-height)] z-10 overflow-hidden rounded-md border border-border1 bg-red-500 shadow-xl',
            !open && 'hidden'
          )}
          style={{ left }}>
          {children}
        </div>,
        document.body
      )}
    </div>
  )
}
