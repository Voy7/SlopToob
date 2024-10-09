import Icon, { IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  icon?: IconNames
  children: React.ReactNode
} & React.HTMLAttributes<HTMLButtonElement>

export default function MenuActionButton({ icon, children, className, ...props }: Props) {
  return (
    <button
      className={twMerge(
        'group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-text2 hover:bg-blue-500 hover:text-white',
        className
      )}
      {...props}>
      {children}
      {icon && (
        <div className="rounded-full bg-bg2 p-1 group-hover:bg-[unset]">
          <Icon name={icon} />
        </div>
      )}
    </button>
  )
}
