'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  title: string
  isOpen: boolean
  setClose: Function
  canEscapeKeyClose?: boolean
  children: React.ReactNode
}

// Standard modal component
export default function Modal({
  title,
  isOpen,
  setClose,
  canEscapeKeyClose = true,
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function backgroundClick() {
    setClose()
  }

  if (!show) return null

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className={twMerge(
        'modalBackgroundAnimation fixed inset-0 bg-black bg-opacity-50 opacity-0 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
        isOpen && 'opacity-100'
      )}
      onClick={backgroundClick}
    >
      <div
        className={twMerge(
          'modalContainerAnimation fixed left-1/2 top-1/2 w-auto max-w-full -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-border1 bg-bg1 opacity-0 shadow-md transition-all duration-300 ease-in-out',
          isOpen && 'opacity-100'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-2 my-2 flex items-center justify-between gap-4 border-b border-border1 pb-2">
          <h2 className="pointer-events-none text-lg font-normal text-text1">{title}</h2>
          <button
            className="flex cursor-pointer items-center justify-center rounded border border-border1 bg-bg2 p-1 text-xl text-text1 transition-all duration-200 ease-in-out hover:border-border2 hover:bg-bg3"
            onClick={() => setClose()}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
