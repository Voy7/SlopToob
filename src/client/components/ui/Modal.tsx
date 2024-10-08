'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  title: JSX.Element | string
  isOpen: boolean
  setClose: Function
  canEscapeKeyClose?: boolean
  className?: string
  children: React.ReactNode
}

// Standard modal component
export default function Modal({
  title,
  isOpen,
  setClose,
  canEscapeKeyClose = true,
  className,
  children
}: Props) {
  const [show, setShow] = useState<boolean>(isOpen)

  // Sync 'show' state with isOpen and animation delay
  useEffect(() => {
    if (isOpen) {
      setShow(true)
      return
    }

    const timeout = setTimeout(() => {
      setShow(false)
    }, 300) // Animation duration

    return () => clearTimeout(timeout)
  }, [isOpen])

  // Escape key press logic
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !canEscapeKeyClose) return
      event.preventDefault()
      setClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!show) return null

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      data-modal
      className={twMerge(
        'animate-fade-in fixed left-0 top-0 h-screen w-screen bg-black bg-opacity-50 opacity-0 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
        isOpen && 'opacity-100'
      )}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        setClose()
      }}>
      <div
        className={twMerge(
          'animate-modal-container fixed left-1/2 top-1/2 max-h-full w-auto max-w-full -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-border1 bg-bg1 opacity-0 shadow-md transition-all duration-300 ease-in-out',
          isOpen && 'opacity-100',
          className
        )}>
        <header className="mx-2 flex h-[3rem] items-center justify-between gap-4 border-b border-border1">
          <h2 className="cursor-default text-lg font-normal text-text1">{title}</h2>
          <button
            className="flex cursor-pointer items-center justify-center rounded border border-border1 bg-bg2 p-1 text-xl text-text1 transition-all duration-200 ease-in-out hover:border-border2 hover:bg-bg3"
            onClick={() => setClose()}>
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.querySelector('#modals-root')!
  )
}
