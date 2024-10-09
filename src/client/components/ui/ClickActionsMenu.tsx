'use client'

import { useEffect, useRef, useState } from 'react'
import FloatingAnchored, { type Placement } from '@/components/headless/FloatingAnchored'

type Props = {
  placement: Placement
  offset?: number
  children: React.ReactNode
}

export default function ClickActionsMenu({ placement, offset = 5, children }: Props) {
  const [show, setShow] = useState<boolean>(false)

  const anchorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!anchorRef.current) return
    const parent = anchorRef.current.parentElement
    if (!parent) return

    const parentOnClick = () => setShow((prev) => !prev)
    parent.addEventListener('click', parentOnClick)

    return () => {
      parent.removeEventListener('click', parentOnClick)
    }
  }, [])

  // Close if clicked outside of menu or on a menu button
  useEffect(() => {
    if (!show) return

    function handleClick(event: MouseEvent) {
      const parent = anchorRef.current?.parentElement
      if (!parent) return
      if (event.target instanceof HTMLElement && event.target.dataset.noClose) return
      if (!parent.contains(event.target as Node)) setShow(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setShow(false)
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [show])

  return (
    <>
      <div ref={anchorRef} className="hidden" />
      <FloatingAnchored
        className="whitespace-nowrap"
        sharedClassName="bg-bg1"
        borderColor="bg-border1"
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
