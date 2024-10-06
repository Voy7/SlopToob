'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import Icon, { type IconNames } from '@/components/ui/Icon'
import { type AdminSectionID } from '@/app/admin/adminSections'

type Props = {
  section?: AdminSectionID
  settingsSection?: string
  icon?: IconNames
  children: string | React.ReactNode
}

export default function JumpTo({ section, settingsSection, icon, children }: Props) {
  const { setSection, setSettingsSubSection } = useAdminContext()

  function onClick() {
    if (settingsSection) section = 'settings'
    if (!section) return
    setSection(section)
    if (settingsSection) setSettingsSubSection(settingsSection)
  }

  return (
    <button
      className="my-2 flex shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-lg p-2 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
      onClick={onClick}>
      <div className="flex items-center gap-1.5">
        {icon && <Icon name={icon} />}
        {children}
      </div>
    </button>
  )
}
