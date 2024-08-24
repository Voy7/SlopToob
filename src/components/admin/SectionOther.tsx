'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import {
  SettingGroup,
  Description,
  Header,
  ToggleOption,
  NumberOption,
  ButtonOption,
  Gap
} from '@/components/admin/SettingsComponents'

export default function SectionOther() {
  const { streamInfo } = useAdminContext()

  const pauseWhenInactive = useToggleOption('pauseWhenInactive')
  const targetQueueSize = useNumberOption('targetQueueSize')
  const videoPaddingSeconds = useNumberOption('videoPaddingSeconds')
  const errorDisplaySeconds = useNumberOption('errorDisplaySeconds')
  const torrentNameParsing = useToggleOption('torrentNameParsing')
  const showChatMessagesInConsole = useToggleOption('showChatMessagesInConsole')

  return (
    <>
      <h2>Advanced</h2>
      <SettingGroup>
        <Header icon="settings">Advanced Settings</Header>
        <ToggleOption label="Pause When Inactive" {...pauseWhenInactive} />
        <Description>
          Pause the stream when no one is watching, will automatically resume when someone joins.
        </Description>
        <Gap />
        <NumberOption label="Target Queue Size" type="integer" {...targetQueueSize} />
        <Description>
          Amount of videos from the active playlist to populate the queue with.
        </Description>
        <Gap />
        <NumberOption label="Video Padding Seconds" type="float" {...videoPaddingSeconds} />
        <Description>
          Amount of seconds to pad the end of videos by. Can help with videos being cut off early
          due to client latency.
        </Description>
        <Gap />
        <NumberOption label="Error Display Seconds" type="float" {...errorDisplaySeconds} />
        <Description>How long to display errors on the player for in seconds.</Description>
        <Gap />
        <ToggleOption label="Torrent Name Parsing" {...torrentNameParsing} />
        <Description>Parse common torrent filename patterns into nice video titles.</Description>
        <Gap />
        <ToggleOption label="Show Chat Messages in Console" {...showChatMessagesInConsole} />
        <Description>Show all chat messages in the server console.</Description>
      </SettingGroup>
    </>
  )
}
