import { useState } from 'react'
import { useFloating, offset } from '@floating-ui/react-dom'
import type { Placement } from '@/components/ui/Tooltip'

export default function useTooltip(placement: Placement = 'bottom') {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const floating = useFloating({
    placement: placement,
    middleware: [offset(10)]
  })
  
  return ({
    anchorProps: {
      ref: floating.refs.setReference,
      onMouseEnter: () => setIsOpen(true),
      onMouseLeave: () => setIsOpen(false)
    },
    tooltipProps: {
      floatingRef: floating.refs.setFloating,
      floatingStyles: floating.floatingStyles,
      isOpen: isOpen,
      placement: placement
    }
  })
}