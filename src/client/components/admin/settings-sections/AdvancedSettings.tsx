'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'

export default function AdvancedSettings() {
  const pauseWhenInactive = useToggleOption('pauseWhenInactive')
  const targetQueueSize = useNumberOption('targetQueueSize')
  const videoPaddingSeconds = useNumberOption('videoPaddingSeconds')
  const errorDisplaySeconds = useNumberOption('errorDisplaySeconds')
  const torrentNameParsing = useToggleOption('torrentNameParsing')
  const showChatMessagesInConsole = useToggleOption('showChatMessagesInConsole')

  const enableVideoEventLogging = useToggleOption('enableVideoEventLogging')
  const showVideoEventLogsInConsole = useToggleOption('showVideoEventLogsInConsole')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="settings">Advanced Settings</Header>
        <ToggleOption label="Pause When Inactive" defaultValue={true} {...pauseWhenInactive} />
        <Description>
          Pause the stream when no one is watching, will automatically resume when someone joins.
        </Description>
        <div className="h-4" />
        <NumberOption
          label="Target Queue Size"
          type="integer"
          defaultValue={3}
          {...targetQueueSize}
        />
        <Description>
          Amount of videos from the active playlist to populate the queue with.
        </Description>
        <div className="h-4" />
        <NumberOption
          label="Video Padding Seconds"
          type="float"
          defaultValue={1}
          {...videoPaddingSeconds}
        />
        <Description>
          Amount of seconds to pad the end of videos by. Can help with videos being cut off early
          due to client latency.
        </Description>
        <div className="h-4" />
        <ToggleOption label="Torrent Name Parsing" defaultValue={false} {...torrentNameParsing} />
        <Description>Parse common torrent filename patterns into nice video titles.</Description>
        <div className="h-4" />
        <NumberOption
          label="Error Display Seconds"
          type="float"
          defaultValue={5}
          {...errorDisplaySeconds}
        />
        <Description>How long to display errors on the player for in seconds.</Description>
        <div className="h-4" />
        <ToggleOption
          label="Show Chat Messages in Console"
          defaultValue={true}
          {...showChatMessagesInConsole}
        />
        <Description>Show all chat messages in the server console.</Description>
      </SettingGroup>
      <div className="h-8" />
      <SettingGroup>
        <Header icon="admin-panel">Video Event Logger</Header>
        <ToggleOption
          label="Enable Video Event Logging"
          defaultValue={true}
          {...enableVideoEventLogging}
        />
        <ToggleOption
          label="Show Video Event Logs in Console"
          defaultValue={false}
          {...showVideoEventLogsInConsole}
        />
        <Description>
          Generate event timeline logs of video instances, used for developer debugging.
        </Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
