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

    const showTooltip = () => setShow(true)
    const hideTooltip = () => setShow(false)

    parent.addEventListener('mouseenter', showTooltip)
    parent.addEventListener('mouseleave', hideTooltip)
    parent.addEventListener('touchstart', showTooltip)
    parent.addEventListener('touchend', hideTooltip)
    parent.addEventListener('click', hideTooltip)
    parent.addEventListener('focus', showTooltip)
    parent.addEventListener('blur', hideTooltip)

    return () => {
      parent.removeEventListener('mouseenter', showTooltip)
      parent.removeEventListener('mouseleave', hideTooltip)
      parent.removeEventListener('touchstart', showTooltip)
      parent.removeEventListener('touchend', hideTooltip)
      parent.removeEventListener('click', hideTooltip)
      parent.removeEventListener('focus', showTooltip)
      parent.removeEventListener('blur', hideTooltip)
    }
  }, [])

  return (
    <>
      <div ref={anchorRef} className="hidden" />
      <FloatingAnchored
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
