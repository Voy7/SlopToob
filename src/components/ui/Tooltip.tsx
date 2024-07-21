import { createPortal } from 'react-dom'
import styles from './Tooltip.module.scss'
import type { useFloating } from '@floating-ui/react-dom'

export type Placement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'left'
  | 'right'

type FloatingProps = ReturnType<typeof useFloating>

type Props = {
  floatingRef: FloatingProps['refs']['setFloating']
  floatingStyles: FloatingProps['floatingStyles']
  isOpen: boolean
  placement: Placement
  children: React.ReactNode
}

export default function Tooltip({
  floatingRef,
  floatingStyles,
  isOpen,
  placement,
  children
}: Props) {
  if (!isOpen) return null

  return createPortal(
    <div ref={floatingRef} style={floatingStyles} className={styles.tooltip}>
      {children}
      <div className={`${styles.arrow} ${styles[placement]}`} />
    </div>,
    document.body
  )
}
