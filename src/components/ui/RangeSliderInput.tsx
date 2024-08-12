import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  scrollStep?: number
  className?: string
  trackClassName?: string
  progressClassName?: string
  thumbClassName?: string
}

export default function RangeSliderInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  scrollStep = 5,
  className,
  trackClassName,
  progressClassName,
  thumbClassName
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Controls events for slider
  // - MouseDown on any part of the slider will set the value to the clicked position
  // - Dragging while holding the mouse will update the value
  // - MouseUp will stop the update
  useEffect(() => {
    const containerElement = containerRef.current!

    function updateValue(event: MouseEvent) {
      const { left, width } = containerElement.getBoundingClientRect()
      const x = event.clientX - left
      const value = Math.min(max, Math.max(min, (x / width) * max))
      const roundedValue = Math.round(value / step) * step
      console.log(roundedValue)
      onChange(roundedValue)
    }

    function startDrag(event: MouseEvent) {
      setIsDragging(true)
      updateValue(event)
    }

    function stopDrag() {
      setIsDragging(false)
    }

    function drag(event: MouseEvent) {
      if (isDragging) updateValue(event)
    }

    function mouseWheel(event: WheelEvent) {
      event.preventDefault()
      onChange(Math.min(max, Math.max(min, value + (event.deltaY > 0 ? -scrollStep : scrollStep))))
    }

    containerElement.addEventListener('mousedown', startDrag)
    containerElement.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', stopDrag)
    containerElement.addEventListener('wheel', mouseWheel)

    return () => {
      containerElement.removeEventListener('mousedown', startDrag)
      containerElement.removeEventListener('mousemove', drag)
      document.removeEventListener('mouseup', stopDrag)
      containerElement.removeEventListener('wheel', mouseWheel)
    }
  }, [containerRef, isDragging, onChange, min, max, step])

  return (
    <div
      className={twMerge('relative h-full w-full cursor-pointer', className)}
      ref={containerRef}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-orientation="horizontal"
      tabIndex={0}>
      <div
        className={twMerge(
          'absolute top-1/2 h-[0.5rem] w-full -translate-y-1/2 transform overflow-hidden rounded-full bg-[rgba(136,136,136,0.5)] shadow-md',
          trackClassName
        )}>
        <div
          className={twMerge('h-full bg-white', progressClassName)}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <div
        className={twMerge(
          'absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-md border-[1px] border-[rgba(0,0,0,0.5)] bg-white',
          thumbClassName
        )}
        style={{ left: `${(value / max) * 100}%` }}
      />
    </div>
  )
}
