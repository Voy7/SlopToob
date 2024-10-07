import Icon, { type IconNames } from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

type Props = {
  value: string
  setValue: (value: string) => void
  sections: {
    id: string
    label: JSX.Element | string
    icon?: IconNames
  }[]
}

export default function SubSectionSelector({ value, setValue, sections }: Props) {
  return (
    <div className="mb-4 mt-2 flex w-full items-center overflow-x-auto overflow-y-hidden border-b border-border1">
      {sections.map((section) => (
        <button
          key={section.id}
          className={twMerge(
            'relative flex shrink-0 items-center justify-center gap-1 self-stretch border-b border-transparent p-2 text-center transition-[background] duration-500 active:bg-bg4 active:duration-0',
            value === section.id
              ? 'border-blue-500 bg-bg2 text-text1'
              : 'hover:bg-bg2 hover:text-text1 hover:underline'
          )}
          onClick={() => setValue(section.id)}>
          {section.icon && (
            <div className="text-sm text-text3">
              <Icon name={section.icon} />
            </div>
          )}
          {section.label}
        </button>
      ))}
    </div>
  )
}
