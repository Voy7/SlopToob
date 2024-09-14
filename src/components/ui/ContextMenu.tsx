'use client'

import { useEffect, useRef, useState } from 'react'
import FloatingContextMenu from '@/components/headless/FloatingContextMenu'

type Props = {
  children: React.ReactNode
}

export default function ContextMenu({ children }: Props) {
  const [show, setShow] = useState<boolean>(false)
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

    parent.addEventListener('contextmenu', handleContextMenu)

    return () => {
      parent.removeEventListener('contextmenu', handleContextMenu)
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
