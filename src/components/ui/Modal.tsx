'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/ui/Icon'
import styles from './Modal.module.scss'

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
    }, 350) // Animation duration

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={isOpen ? `${styles.modalBackground} ${styles.show}` : styles.modalBackground}
      onClick={backgroundClick}
    >
      <div
        className={isOpen ? `${styles.modalContainer} ${styles.show2}` : styles.modalContainer}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={() => setClose()}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
