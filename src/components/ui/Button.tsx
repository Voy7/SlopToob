'use client'

import Icon, { IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

const variants = {
  main: 'bg-blue-600 hover:bg-blue-500 border-blue-600',
  normal: 'bg-gray-900 hover:bg-gray-800 border-gray-800 disabled:bg-gray-900',
  danger: 'text-red-400 bg-gray-900 hover:bg-red-500 border-gray-800 hover:border-red-6z00'
}

type ButtonVariant = keyof typeof variants

type Props = {
  variant?: ButtonVariant
  icon?: IconNames
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  loading?: boolean
  isSubmit?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

// Fancy button component
export default function Button({
  variant,
  icon,
  onClick,
  loading,
  isSubmit,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={twMerge(
        'relative cursor-pointer rounded-lg border border-blue-600 bg-blue-500 px-3 py-2 text-white shadow-lg transition duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-75',
        loading && 'disabled:cursor-default disabled:bg-opacity-75 disabled:opacity-100',
        variant && variants[variant],
        className
      )}
      onClick={onClick}
      type={isSubmit ? 'submit' : 'button'}
      disabled={disabled || loading}
      {...props}>
      <>
        <div
          className={twMerge(
            'flex items-center justify-center gap-0.5 whitespace-nowrap transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100'
          )}>
          {icon && <Icon name={icon} />}
          <span>{children}</span>
        </div>
        {loading && (
          <div className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center">
            <Icon name="loading" />
          </div>
        )}
      </>
    </button>
  )
}
