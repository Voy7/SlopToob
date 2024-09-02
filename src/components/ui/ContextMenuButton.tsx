import Icon, { IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  icon?: IconNames
  children: React.ReactNode
} & React.HTMLAttributes<HTMLButtonElement>

export default function ContextMenuButton({ icon, children, className, ...props }: Props) {
  return (
    <button
      className={twMerge(
        'flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-text2 hover:bg-blue-500 hover:text-white',
        className
      )}
      {...props}>
      {children}
      {icon && <Icon name={icon} />}
    </button>
  )
}
