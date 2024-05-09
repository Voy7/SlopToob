'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Description, Header, ToggleOption, NumberOption, Gap } from '@/components/admin/SettingsComponents'

export default function SectionAdvanced() {
  const pauseWhenInactive = useToggleOption('pauseWhenInactive')
  const maxTranscodingJobs = useNumberOption('maxTranscodingJobs')
  const targetQueueSize = useNumberOption('targetQueueSize')
  const historyMaxItems = useNumberOption('historyMaxItems')
  const videoPaddingSeconds = useNumberOption('videoPaddingSeconds')
  const errorDisplaySeconds = useNumberOption('errorDisplaySeconds')

  return (
    <>
      <h2>Advanced</h2>
      <SettingGroup>
        <Header icon="settings">Advanced Settings</Header>
        <ToggleOption label="Pause When Inactive" {...pauseWhenInactive} />
        <Description>Pause the stream when no one is watching, will automatically resume when someone joins.</Description>
        <Gap />
        <NumberOption label="Max Transcoding Jobs" type="integer" {...maxTranscodingJobs} />
        <Description>Maximum number of transcoding jobs that can run at once.<br />Recommended: 2 - 3, use 1 if server has performance issues.</Description>
        <Gap />
        <NumberOption label="Target Queue Size" type="integer" {...targetQueueSize} />
        <Description>Amount of videos from the active playlist to populate the queue with.</Description>
        <Gap />
        <NumberOption label="Shuffle History Max Items" type="integer" {...historyMaxItems} />
        <Description>Maximum number of videos to keep in history for smart-shuffle logic.</Description>
        <Gap />
        <NumberOption label="Video Padding Seconds" type="float" {...videoPaddingSeconds} />
        <Description>Amount of seconds to pad the end of videos by. Can help with videos being cut off early due to client latency.</Description>
        <Gap />
        <NumberOption label="Error Display Seconds" type="float" {...errorDisplaySeconds} />
        <Description>How long to display errors on the player for in seconds.</Description>
      </SettingGroup>
    </>
  )
}