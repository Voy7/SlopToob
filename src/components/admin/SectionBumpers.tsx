'use client'

import { SocketEvent } from '@/lib/enums'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Description, Header, NumberOption } from '@/components/admin/SettingsComponents'
import BumpersList from '@/components/admin/BumpersList'

export default function SectionBumpers() {
  const bumperInterval = useNumberOption(SocketEvent.SettingBumperIntervalMinutes)

  return (
    <>
      <h2>BUMPERS</h2>
      <SettingGroup>
        <Header icon="bumper">BUMPER SETTINGS</Header>
        <NumberOption label="Bumper Interval in Minutes" type="float" {...bumperInterval} />
        <Description>Minimum time between bumpers in minutes.</Description>
      </SettingGroup>
      <BumpersList />
    </>
  )
}