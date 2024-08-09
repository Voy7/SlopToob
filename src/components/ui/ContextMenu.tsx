import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

type Props = {
  show: boolean
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export default function ContextMenu({ show, className, ...props }: Props) {
  if (typeof window === 'undefined') return null

  const containerRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const parent = container.parentElement
    if (!parent) return

    // Top y of parent should match y of container
    // If there is room to the right of the parent, show on the right
    // Otherwise, show on the left
    const parentRect = parent.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // Amount of pixels to the right of the parent in viewport
    const rightSpace = window.innerWidth - parentRect.right
    const leftSpace = parentRect.left

    // If there is enough space to the right, show on the right
    if (rightSpace > containerRect.width) {
      setPosition([parentRect.right, parentRect.top])
    } else {
      setPosition([parentRect.left - containerRect.width, parentRect.top])
    }
  }, [])

  return (
    <div ref={containerRef} onClick={(event) => event.stopPropagation()}>
      {position &&
        show &&
        createPortal(
          <div
            className={twMerge(
              'absolute z-50 rounded-lg border border-border2 bg-bg1 py-2 shadow-lg',
              className
            )}
            style={{
              top: position ? position[1] : 0,
              left: position ? position[0] : 0
            }}
            {...props}
          />,
          document.body
        )}
    </div>
  )
}
