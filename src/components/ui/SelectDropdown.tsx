'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import Icon, { type IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

const MARGIN_PX = 20

type Props = {
  label: React.ReactNode | string
  icon?: IconNames
  children: React.ReactNode
} & React.HTMLAttributes<HTMLButtonElement>

// Custom dropdown element
export default function SelectDropdown({ label, icon, children, className, ...props }: Props) {
  if (typeof window === 'undefined') return null

  const [open, setOpen] = useState(false)

  // Position array = [top, left, minWidth, height]
  const [contentPosition, setContentPosition] = useState<[number, number, number, number] | null>(
    null
  )

  const containerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return setContentPosition(null)
    if (!containerRef.current || !contentRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()

    let left: number
    let top: number
    let height: number
    let isAbove: boolean

    // If content goes off screen to the right, move it left
    if (contentRect.right > window.innerWidth) {
      left = window.innerWidth - contentRect.width - MARGIN_PX
    } else {
      left = containerRect.left
    }

    const spaceBelowContainer = window.innerHeight - containerRect.bottom - MARGIN_PX

    // If specific condiitions are met, move the dropdown above the button
    if (containerRect.top > window.innerHeight / 2 && contentRect.height > spaceBelowContainer) {
      isAbove = true
      top = Math.max(window.scrollY + containerRect.top - contentRect.height - 1, MARGIN_PX)
      height = containerRect.top - MARGIN_PX
    } else {
      isAbove = false
      top = window.scrollY + containerRect.bottom + 1
      height = window.innerHeight - containerRect.bottom - MARGIN_PX
    }

    if (height > contentRect.height) height = contentRect.height

    // For transition animation
    if (isAbove) contentRef.current.style.transform = 'translateY(1rem)'
    else contentRef.current.style.transform = 'translateY(-1rem)'

    setContentPosition([top, left, containerRect.width, height])

    // Close dropdown when clicking outside of it
    function close(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    // Close dropdown when pressing escape
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    let scrollTop = contentRef.current?.scrollTop || 0
    // Prevent scrolling except inside the dropdown content
    function preventScroll(event: WheelEvent | TouchEvent) {
      event.preventDefault()
      if (!contentRef.current) return

      // Handle mouse wheel, touchmove, and manual scroll
      if (event.type !== 'wheel' && event.type !== 'touchmove') return
      const deltaY =
        'deltaY' in event
          ? event.deltaY
          : event.touches?.[0]?.clientY - event.touches?.[1]?.clientY || 0
      const deltaX =
        'deltaX' in event
          ? event.deltaX
          : event.touches[0]?.clientX - event.touches[1]?.clientX || 0

      scrollTop = scrollTop + deltaY
      if (scrollTop < 0) scrollTop = 0
      const scrollTopMax = contentRef.current.scrollHeight - contentRef.current.clientHeight
      if (scrollTop > scrollTopMax) scrollTop = scrollTopMax

      contentRef.current.scrollTo({
        top: scrollTop,
        left: deltaX,
        behavior: 'smooth'
      })
    }

    window.addEventListener('click', close)
    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={containerRef}
        className={twMerge(
          'flex w-full items-center gap-2 overflow-hidden bg-bg2 p-2 duration-300 active:bg-bg4 active:duration-0',
          open && 'bg-bg3',
          className
        )}
        onClick={() => setOpen(!open)}>
        {icon && <Icon name={icon} className="shrink-0" />}
        <span
          key={label?.toString()}
          className="animate-fade-in w-full overflow-hidden text-ellipsis whitespace-nowrap text-left">
          {label}
        </span>
        <Icon
          name="down-chevron"
          className={twMerge(
            'shrink-0 transform text-text3 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {createPortal(
        <div
          ref={contentRef}
          className={twMerge(
            'absolute z-50 overflow-y-auto border border-border2 bg-bg1 py-2 opacity-0 shadow-2xl transition-none duration-150 ease-in-out',
            !open && 'hidden',
            !contentPosition ? 'invisible' : 'opacity-100 transition-[transform,opacity]'
          )}
          style={
            contentPosition
              ? {
                  top: contentPosition[0],
                  left: contentPosition[1],
                  minWidth: contentPosition[2],
                  height: contentPosition[3],
                  maxWidth: `calc(100vw - ${MARGIN_PX * 2}px)`,
                  transform: 'translateY(0)'
                }
              : {
                  maxWidth: `calc(100vw - ${MARGIN_PX * 2}px)`
                }
          }>
          {children}
        </div>,
        document.body
      )}
    </>
  )
}
