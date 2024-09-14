'use client'

import { useEffect, useRef, useState } from 'react'
import FloatingContextMenu from '@/components/headless/FloatingContextMenu'

type Props = {
  show: boolean
  setShow: (show: boolean) => void
  children: React.ReactNode
}

export default function ContextMenu({ show, setShow, children }: Props) {
  const [position, setPosition] = useState<[number, number]>([0, 0])

  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!anchorRef.current) return
    const parent = anchorRef.current.parentElement
    if (!parent) return

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault()
      setPosition([event.clientY, event.clientX])
      setShow(true)
    }

    let touchStartTime: number
    function handleTouchStart(event: TouchEvent) {
      touchStartTime = Date.now()
    }
    function handleTouchEnd(event: TouchEvent) {
      if (Date.now() - touchStartTime < 500) return
      event.preventDefault()
      setPosition([event.changedTouches[0].clientY, event.changedTouches[0].clientX])
      setShow(true)
    }

    parent.addEventListener('contextmenu', handleContextMenu)
    parent.addEventListener('touchstart', handleTouchStart)
    parent.addEventListener('touchend', handleTouchEnd)

    return () => {
      parent.removeEventListener('contextmenu', handleContextMenu)
      parent.removeEventListener('touchstart', handleTouchStart)
      parent.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Close if clicked outside of menu or pressed escape
  useEffect(() => {
    if (!show) return

    function handleClick(event: MouseEvent) {
      setShow(false)
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
      <FloatingContextMenu show={show} setShow={setShow} position={position} offset={2}>
        <div className="animate-fade-in rounded-lg border border-border1 bg-bg1 p-2 shadow-xl [animation-duration:50ms_!important]">
          {children}
        </div>
      </FloatingContextMenu>
    </>
  )
}
