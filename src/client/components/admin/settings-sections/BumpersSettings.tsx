'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import JumpTo from '@/components/admin/common/JumpTo'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'

export default function BumperSettings() {
  const bumpersEnabled = useToggleOption('bumpersEnabled')
  const bumperInterval = useNumberOption('bumperIntervalMinutes')

  return (
    <LoadingBoundary>
      <JumpTo section="bumpers" icon="arrow-left">
        Go to Bumpers List
      </JumpTo>
      <SettingGroup>
        <Header icon="bumper">Bumper Settings</Header>
        <ToggleOption label="Bumpers Enabled" {...bumpersEnabled} />
        <NumberOption label="Bumper Interval in Minutes" type="float" {...bumperInterval} />
        <Description>Minimum time between bumpers in minutes.</Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
