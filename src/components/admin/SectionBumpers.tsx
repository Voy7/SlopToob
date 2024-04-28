'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Description, Header, ToggleOption, NumberOption } from '@/components/admin/SettingsComponents'
import BumpersList from '@/components/admin/BumpersList'

export default function SectionBumpers() {
  const bumpersEnabled = useToggleOption('bumpersEnabled')
  const bumperInterval = useNumberOption('bumperIntervalMinutes')

  return (
    <>
      <h2>BUMPERS</h2>
      <SettingGroup>
        <Header icon="bumper">BUMPER SETTINGS</Header>
        <ToggleOption label="Bumpers Enabled" {...bumpersEnabled} />
        <NumberOption label="Bumper Interval in Minutes" type="float" {...bumperInterval} />
        <Description>Minimum time between bumpers in minutes.</Description>
      </SettingGroup>
      <BumpersList />
    </>
  )
}