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
    <div className="flex w-full items-center p-2">
      {sections.map((section) => (
        <button
          key={section.id}
          className={twMerge(
            'flex w-full items-center justify-center gap-2 border-b border-transparent py-2 text-center',
            value === section.id
              ? 'border-blue-500 bg-bg2 text-text1'
              : 'hover:bg-bg2 hover:text-text1'
          )}
          onClick={() => setValue(section.id)}>
          {section.icon && <Icon name={section.icon} />}
          {section.label}
        </button>
      ))}
    </div>
  )
}
