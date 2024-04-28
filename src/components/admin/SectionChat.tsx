'use client'

import { SocketEvent } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Header, Description, Gap, ToggleOption, NumberOption } from '@/components/admin/SettingsComponents'

export default function SectionChat() {
  const nicknameOnlyAlphanumeric = useToggleOption('nicknameOnlyAlphanumeric')
  const nicknameMinLength = useNumberOption('nicknameMinLength')
  const nicknameMaxLength = useNumberOption('nicknameMaxLength')
  const chatMaxLength = useNumberOption('chatMaxLength')

  return (
    <>
      <h2>CHAT SETTINGS</h2>
      <SettingGroup>
        <Header icon="user">Chat Nicknames</Header>
        <ToggleOption {...nicknameOnlyAlphanumeric} label="Only Alphanumeric" />
        <Description>Can nickname can only contain letters, numbers, underscores, and spaces.</Description>
        <Gap />
        <NumberOption type="integer" {...nicknameMinLength} label="Minimum Length" />
        <NumberOption type="integer" {...nicknameMaxLength} label="Maximum Length" />
        <Description>Minimum and maximum amount of characters in nicknames.</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="chat">Chat Messages</Header>
        <NumberOption type="integer" {...chatMaxLength} label="Maximum Message Length" />
        <Description>Maximum amount of characters in a chat message.</Description>
      </SettingGroup>
    </>
  )
}