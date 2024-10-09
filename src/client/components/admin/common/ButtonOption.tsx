'use client'

import { twMerge } from 'tailwind-merge'

type ButtonOptionProps = {
  label: string
  swapped?: boolean
  children: React.ReactNode
}

export default function ButtonOption({ label, swapped, children }: ButtonOptionProps) {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between gap-4 rounded-md bg-bg2 p-2 text-text3',
        swapped && 'flex-row-reverse'
      )}>
      {children}
      {label}
    </div>
  )
}
