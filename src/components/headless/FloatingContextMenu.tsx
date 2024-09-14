'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

export type FloatingContentMenuProps = {
  show: boolean
  setShow: (show: boolean) => void
  position: [number, number]
  offset?: number // Amount of px to offset away from origin position
  margin?: number // Minimum px to keep away from viewport edge
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export default function FloatingAnchored({
  show,
  setShow,
  position,
  offset = 2,
  margin = 10,
  className,
  children,
  ...props
}: FloatingContentMenuProps) {
  if (!show || typeof window === 'undefined') return null

  const floatingRef = useRef<HTMLDivElement>(null)

  // [top, left, maxWidth]
  const [floatingPosition, setFloatingPosition] = useState<[number, number, number] | null>(null)

  useEffect(() => {
    if (!floatingRef.current) return

    const floatingRect = floatingRef.current.getBoundingClientRect()

    const spaceLeft = position[1] - margin - offset
    const spaceRight = window.innerWidth - position[1] - margin - offset

    let top = position[0] + offset + window.scrollY
    if (floatingRect.height > window.innerHeight - position[0] + offset) {
      top = window.innerHeight - floatingRect.height - offset + window.scrollY
    }

    let left = 0
    let maxWidth = 0

    // Put element on the left
    if (spaceLeft > spaceRight && spaceRight < floatingRect.width) {
      left = position[1] - floatingRect.width - offset
      maxWidth = spaceLeft
    }
    // Put element on the right
    else {
      left = position[1] + offset
      maxWidth = spaceRight
    }

    setFloatingPosition([top, left, maxWidth])
  }, [show, offset, margin, position])

  return createPortal(
    <div
      data-floating-menu
      ref={floatingRef}
      onClick={(event) => event.stopPropagation()}
      className={twMerge('absolute z-50', (!floatingPosition || !show) && 'invisible')}
      style={{
        top: floatingPosition ? floatingPosition[0] : 0,
        left: floatingPosition ? floatingPosition[1] : 0,
        maxWidth: floatingPosition ? floatingPosition[2] : `calc(100vw - ${margin * 2}px)`,
        maxHeight: `calc(100vh - ${margin * 2}px)`
      }}
      {...props}>
      {children}
    </div>,
    document.body
  )
}
