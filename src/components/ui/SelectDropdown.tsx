'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Icon, { IconNames } from '@/components/ui/Icon'
import styles from './SelectDropdown.module.scss'

type Props = {
  text: string,
  icon?: IconNames,
  image?: string,
  isFullHeight?: boolean,
  children: React.ReactNode
}

// Custom dropdown element
export default function SelectDropdown({ text, icon, image, isFullHeight, children }: Props) {
  const [open, setOpen] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)

    // If content goes off screen to the right, move it left
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect()
      if (rect.right > window.innerWidth) {
        contentRef.current.style.right = '0'
        contentRef.current.style.left = 'auto'
      }
    }
    return () => window.removeEventListener('click', close)
  }, [open])

  const buttonStyles: string[] = [styles.button]
  if (open) buttonStyles.push(styles.open)
  if (isFullHeight) buttonStyles.push(styles.fullHeight)

  return (
    <div className={styles.dropdown} onClick={() => setOpen(!open)}>
      <button className={buttonStyles.join(' ')}>
        {icon && <Icon name={icon} />}
        {image && <Image src={image} alt="" width={24} height={24} />}
        <span>{text}</span>
        <Icon name="down-chevron" className={styles.arrow} />
      </button>
      {open && (
        <div className={styles.dropdownContent} ref={contentRef}>
          {children}
        </div>
      )}
    </div>
  )
}