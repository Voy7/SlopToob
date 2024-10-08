import Icon, { type IconNames } from '@/components/ui/Icon'

export default function Header({ icon, children }: { icon: IconNames; children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-2 py-2">
      {icon && (
        <div className="rounded-full bg-bg3 p-1">
          <Icon name={icon} />
        </div>
      )}
      <h4 className="whitespace-nowrap text-base uppercase text-text3">{children}</h4>
      <hr className="w-full border-t border-border1" />
    </div>
  )
}
