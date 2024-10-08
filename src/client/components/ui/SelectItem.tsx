import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  label: React.ReactNode | string
  subLabel?: React.ReactNode | string
  active?: boolean
} & React.HTMLAttributes<HTMLButtonElement>

export default function SelectItem({ label, subLabel, active, className, ...props }: Props) {
  return (
    <button
      className={twMerge(
        'flex w-full items-center gap-1.5 overflow-hidden bg-bg1 p-2 text-white',
        active ? 'bg-blue-500' : 'hover:bg-bg2',
        className
      )}
      {...props}>
      <Icon
        name={active ? 'radio-checked' : 'radio-unchecked'}
        className={twMerge('h-3 w-3 shrink-0 text-text3', active && 'text-inherit')}
      />
      <div className="flex w-full items-center gap-2 overflow-hidden">
        <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-left">
          {label}
        </span>
        <span className={twMerge('shrink-0 text-sm text-text3', active && 'text-inherit')}>
          {subLabel}
        </span>
      </div>
    </button>
  )
}
