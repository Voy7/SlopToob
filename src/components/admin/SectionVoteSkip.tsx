'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import { SettingGroup, Header, Description, Gap, ToggleOption,NumberOption } from '@/components/admin/SettingsComponents'

export default function SectionVoteSkip() {
  const voteSkipEnabled = useToggleOption('enableVoteSkip')
  const voteSkipPercentage = useNumberOption('voteSkipPercentage')
  const voteSkipDelaySeconds = useNumberOption('voteSkipDelaySeconds')
  const canVoteSkipIfBumper = useToggleOption('canVoteSkipIfBumper')
  const canVoteSkipIfPaused = useToggleOption('canVoteSkipIfPaused')

  return (
    <>
      <h2>Vote Skip</h2>
      <SettingGroup>
        <Header icon="skip">Vote Skipping</Header>
        <ToggleOption label="Enable Vote Skipping" {...voteSkipEnabled} />
        <Description>Allow users to vote to skip the current video.</Description>
        <Gap />
        <NumberOption label="Vote Skip Percentage" type="percentage" {...voteSkipPercentage} />
        <Description>Percentage of users needed for vote to pass.</Description>
        <Gap />
        <NumberOption label="Vote Skip Delay in Seconds" type="integer" {...voteSkipDelaySeconds} />
        <Description>How long video needs to be playing for before vote skipping is allowed.</Description>
        <Gap />
        <ToggleOption label="Allow Vote Skipping if Bumper" {...canVoteSkipIfBumper} />
        <Description>Allow vote skipping during bumper videos.</Description>
        <Gap />
        <ToggleOption label="Allow Vote Skipping if Paused" {...canVoteSkipIfPaused} />
        <Description>Allow vote skipping while stream is paused.</Description>
      </SettingGroup>
    </>
  )
}