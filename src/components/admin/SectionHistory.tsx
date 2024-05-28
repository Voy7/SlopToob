'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Description, Header, ToggleOption, NumberOption, Gap } from '@/components/admin/SettingsComponents'

export default function SectionHistory() {
  const historyMaxItems = useNumberOption('historyMaxItems')
  const historyDisplayEnabled = useToggleOption('historyDisplayEnabled')
  const historyDisplayItems = useNumberOption('historyDisplayItems')
  const historyDisplayBumpers = useToggleOption('historyDisplayBumpers')

  return (
    <>
      <h2>History</h2>
      <SettingGroup>
        <Header icon="video-file">Shuffle History Settings</Header>
        <NumberOption label="Shuffle History Max Items" type="integer" {...historyMaxItems} />
        <Description>Maximum number of videos to keep in internal history for smart-shuffle logic.</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="history">History Display Settings</Header>
        <ToggleOption label="Enable History Display" {...historyDisplayEnabled} />
        <Gap />
        <NumberOption label="History Display Items" type="integer" {...historyDisplayItems} />
        <Description>Number of videos to display in the stream history list.</Description>
        <Gap />
        <ToggleOption label="Display Bumpers in History" {...historyDisplayBumpers} />
        <Description>Includes bumpers in the history list.</Description>
      </SettingGroup>
    </>
  )
}