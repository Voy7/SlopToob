import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type FloatingAnchoredProps = {
  show: boolean
  setShow: (show: boolean) => void
  placement: Placement
  offset?: number
  arrowSize?: number
  borderWidth?: number
  borderColor?: string
  sharedClassName?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export default function FloatingAnchored({
  show,
  setShow,
  placement,
  offset = 0,
  arrowSize = 18,
  borderWidth = 5,
  borderColor = 'bg-slate-800',
  sharedClassName,
  className,
  children,
  ...props
}: FloatingAnchoredProps) {
  if (typeof window === 'undefined') return null

  const anchorRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [tooltipPosition, setTooltipPosition] = useState<[number, number] | null>(null)
  const [arrowPosition, setArrowPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!anchorRef.current || !tooltipRef.current) return
    const parent = anchorRef.current.parentElement
    if (!parent) return

    const parentRect = parent.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    const parentTop = parentRect.top + window.scrollY
    const parentLeft = parentRect.left + window.scrollX

    const tooltipWidth = tooltipRect.width + borderWidth * 2
    const tooltipHeight = tooltipRect.height + borderWidth * 2

    let tooltipTop = 0
    let tooltipLeft = 0
    let arrowTop = 0
    let arrowLeft = 0

    const [direction, align] = placement.split('-')
    const isVertical = direction === 'top' || direction === 'bottom'

    switch (direction) {
      case 'top':
        tooltipTop = parentTop - tooltipHeight - arrowSize / 2 - offset
        tooltipLeft = parentLeft + parentRect.width / 2 - tooltipRect.width / 2
        arrowTop = tooltipHeight - borderWidth
        break
      case 'bottom':
        tooltipTop = parentTop + parentRect.height + arrowSize / 2 + offset
        tooltipLeft = parentLeft + parentRect.width / 2 - tooltipRect.width / 2
        arrowTop = borderWidth
        break
      case 'left':
        tooltipTop = parentTop + parentRect.height / 2 - tooltipRect.height / 2
        tooltipLeft = parentLeft - tooltipWidth - arrowSize / 2 - offset
        arrowLeft = tooltipWidth - borderWidth
        break
      case 'right':
        tooltipTop = parentTop + parentRect.height / 2 - tooltipRect.height / 2
        tooltipLeft = parentLeft + parentRect.width + arrowSize / 2 + offset
        arrowLeft = borderWidth
        break
    }

    switch (align) {
      case 'start':
        if (isVertical) tooltipLeft = parentLeft
        else tooltipTop = parentTop
        break
      case 'end':
        if (isVertical) tooltipLeft = parentLeft + parentRect.width - tooltipWidth
        else tooltipTop = parentTop + parentRect.height - tooltipHeight
        break
      default:
        if (isVertical) tooltipLeft = parentLeft + parentRect.width / 2 - tooltipRect.width / 2
        else tooltipTop = parentTop + parentRect.height / 2 - tooltipRect.height / 2
    }

    // Fix any overflow issues
    if (tooltipLeft < 0) {
      tooltipLeft = 0
    }
    // if (tooltipLeft + tooltipWidth > window.innerWidth) {
    //   tooltipLeft = window.innerWidth - tooltipWidth
    // }

    // Align arrow with center of parent element
    if (isVertical) arrowLeft = parentLeft + parentRect.width / 2 - tooltipLeft
    else arrowTop = parentTop + parentRect.height / 2 - tooltipTop

    setTooltipPosition([tooltipTop, tooltipLeft])
    setArrowPosition([arrowTop, arrowLeft])
  }, [placement, offset, arrowSize, borderWidth, show])

  const arrowStyles = useMemo(() => {
    const styles: React.CSSProperties = {}
    if (!arrowPosition) return styles
    styles.top = `${arrowPosition[0]}px`
    styles.left = `${arrowPosition[1]}px`
    return styles
  }, [arrowPosition])

  return (
    <div ref={anchorRef} className="hidden">
      {createPortal(
        <div
          className={twMerge(
            'absolute z-50 max-w-[100vw] rounded-lg',
            borderColor,
            (!tooltipPosition || !show) && 'invisible'
          )}
          style={{
            top: tooltipPosition ? tooltipPosition[0] : 0,
            left: tooltipPosition ? tooltipPosition[1] : 0,
            padding: borderWidth
          }}
          {...props}>
          <div
            className={twMerge('absolute -translate-x-1/2 -translate-y-1/2 rotate-45', borderColor)}
            style={{
              ...arrowStyles,
              width: arrowSize,
              height: arrowSize
            }}
          />
          <div
            className={twMerge(
              'absolute -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-600',
              sharedClassName
            )}
            style={{
              ...arrowStyles,
              width: arrowSize - borderWidth * 2,
              height: arrowSize - borderWidth * 2
            }}
          />
          <div
            ref={tooltipRef}
            className={twMerge(
              'relative rounded-lg bg-slate-600 p-2 text-lg',
              sharedClassName,
              className
            )}>
            {children}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
