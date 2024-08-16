'use client'

import { useEffect, useRef, useState } from 'react'
import FloatingAnchored, { type Placement } from '@/components/ui/FloatingAnchored'

type Props = {
  placement: Placement
  offset?: number
  children: React.ReactNode
}

export default function HoverTooltip({ placement, offset = 5, children }: Props) {
  const [show, setShow] = useState<boolean>(false)

  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!anchorRef.current) return
    const parent = anchorRef.current.parentElement
    if (!parent) return

    const mouseEnter = () => setShow(true)
    const mouseLeave = () => setShow(false)

    parent.addEventListener('mouseenter', mouseEnter)
    parent.addEventListener('mouseleave', mouseLeave)

    return () => {
      parent.removeEventListener('mouseenter', mouseEnter)
      parent.removeEventListener('mouseleave', mouseLeave)
    }
  }, [])

  return (
    <>
      <div ref={anchorRef} className="hidden" />
      <FloatingAnchored
        className="whitespace-nowrap"
        show={show}
        setShow={setShow}
        placement={placement}
        offset={offset}
        arrowSize={12}
        borderWidth={1}>
        {children}
      </FloatingAnchored>
    </>
  )
}
