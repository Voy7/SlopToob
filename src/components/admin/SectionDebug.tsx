'use client'

import useToggleOption from '@/hooks/useToggleOption'
import {
  MainHeader,
  SettingGroup,
  Header,
  Description,
  ToggleOption
} from '@/components/admin/SettingsComponents'
import StreamControls from '@/components/admin/StreamControls'
import QueueList from '@/components/admin/QueueList'
import TranscodeQueue from '@/components/admin/TranscodeQueue'
import ConsoleLogs from '@/components/admin/ConsoleLogs'

export default function SectionDebug() {
  const enableVideoEventLogging = useToggleOption('enableVideoEventLogging')
  const showVideoEventLogsInConsole = useToggleOption('showVideoEventLogsInConsole')

  return (
    <>
      <MainHeader>Developer Debug</MainHeader>
      <StreamControls />
      <SettingGroup>
        <Header icon="admin-panel">Video Event Logger</Header>
        <ToggleOption label="Enable Video Event Logging" {...enableVideoEventLogging} />
        <ToggleOption label="Show Video Event Logs in Console" {...showVideoEventLogsInConsole} />
        <Description>
          Generate event timeline logs of video instances, used for developer debugging.
        </Description>
      </SettingGroup>
      <QueueList />
      <TranscodeQueue />
      <ConsoleLogs />
    </>
  )
}
