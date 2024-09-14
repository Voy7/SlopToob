'use client'

import { useState, useEffect, useRef } from 'react'
import SelectDropdwon from '@/components/ui/SelectDropdown'
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

    const x_MARGIN = 8
    const containerRect = containerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()

    if (containerRect.left + contentRect.width > window.innerWidth - x_MARGIN)
      setLeft(window.innerWidth - contentRect.width - x_MARGIN)
    else if (contentRect.width > window.innerWidth - x_MARGIN * 2) setLeft(x_MARGIN)
    else setLeft(containerRect.left)

    function handleClick(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className="relative h-[var(--header-height)] w-[200px]"
      onClick={() => setOpen(!open)}>
      <button
        className={twMerge(
          'flex h-full w-full items-center justify-between gap-1 p-2 text-lg',
          open ? 'bg-bg3' : 'hover:bg-bg3'
        )}>
        <div className="flex items-center gap-1 overflow-hidden">
          {icon && <Icon name={icon} className="shrink-0 text-sm text-text3" />}
          <div className="flex h-full flex-col overflow-hidden">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">
              {title}
            </span>
            <span
              key={subtitle}
              className="animate-fade-in mt-[-0.5rem] w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm text-text3">
              {subtitle}
            </span>
          </div>
        </div>
        <Icon
          name="down-chevron"
          className={twMerge(
            'shrink-0 transform text-text3 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>
      {createPortal(
        <div
          ref={contentRef}
          className={twMerge(
            'animate-dropdown absolute top-[var(--header-height)] z-10 max-h-[calc(100vh-var(--header-height)-1rem)] w-auto max-w-[calc(100vw-1rem)] flex-col overflow-x-hidden overflow-y-hidden rounded-md border border-border1 bg-bg1 shadow-xl',
            !open && 'hidden'
          )}
          style={{
            left,
            minWidth: containerRef.current
              ? `${containerRef.current?.getBoundingClientRect().width}px`
              : `fit-content`
          }}>
          {children}
        </div>,
        document.body
      )}
    </div>
  )
}
