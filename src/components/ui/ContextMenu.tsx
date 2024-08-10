import { useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

type Props = {
  show: boolean
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export default function ContextMenu({ show, className, ...props }: Props) {
  if (typeof window === 'undefined') return null

  const anchorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const position = useMemo(() => {
    if (!anchorRef.current) return null
    const parent = anchorRef.current.parentElement
    if (!parent) return null

    const parentRect = parent.getBoundingClientRect()

    if (containerRef.current) {
      // TODO: This doesn't work, need to find a way to let the container render first in order to get it's width
      const containerRect = containerRef.current.getBoundingClientRect()

      const rightSpace = window.innerWidth - parentRect.right
      console.log(rightSpace, containerRect.width)
      const leftSpace = parentRect.left

      if (rightSpace > containerRect.width) {
        return [parentRect.right, parentRect.top]
      } else {
        return [parentRect.left - containerRect.width, parentRect.top]
      }
    }

    return [parentRect.right, parentRect.top]
  }, [show])

  return (
    <div ref={anchorRef} onClick={(event) => event.stopPropagation()}>
      {position &&
        show &&
        createPortal(
          <div
            ref={containerRef}
            className={twMerge(
              'fixed z-50 rounded-lg border border-border2 bg-bg1 py-2 shadow-lg',
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
