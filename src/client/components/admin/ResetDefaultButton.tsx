'use client'

import Icon from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'
import { twMerge } from 'tailwind-merge'

type Props = {
  value: unknown
  defaultValue: unknown
  onClick: () => void
}

function unknownToString(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  return `${value}`
}

export default function ResetDefaultButton({ value, defaultValue, onClick }: Props) {
  const isUsingDefault = value === defaultValue

  const valueString = unknownToString(value)
  const defaultValueString = unknownToString(defaultValue)

  return (
    <button
      type="button"
      className={twMerge(
        'flex w-full cursor-pointer items-center justify-center gap-1 bg-bg2 p-1 text-[1.35rem] text-text2 lg:w-auto',
        isUsingDefault ? 'cursor-default opacity-25' : 'hover:bg-bg3 hover:text-text1 active:bg-bg4'
      )}
      onClick={onClick}>
      <HoverTooltip placement="top">
        <div className="flex items-center gap-1">
          {isUsingDefault ? (
            <>
              <Icon name="check" />
              Using default: {defaultValueString}
            </>
          ) : (
            <>
              <Icon name="refresh" />
              Reset to default: {defaultValueString}
            </>
          )}
        </div>
      </HoverTooltip>
      <Icon name="refresh" />
    </button>
  )
}
