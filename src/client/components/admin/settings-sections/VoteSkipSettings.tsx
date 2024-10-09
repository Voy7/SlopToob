'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'

export default function VoteSkipSettings() {
  const voteSkipEnabled = useToggleOption('enableVoteSkip')
  const voteSkipPercentage = useNumberOption('voteSkipPercentage')
  const voteSkipDelaySeconds = useNumberOption('voteSkipDelaySeconds')
  const canVoteSkipIfBumper = useToggleOption('canVoteSkipIfBumper')
  const canVoteSkipIfPaused = useToggleOption('canVoteSkipIfPaused')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="skip">Vote Skipping</Header>
        <ToggleOption label="Enable Vote Skipping" defaultValue={true} {...voteSkipEnabled} />
        <Description>Allow users to vote to skip the current video.</Description>
        <div className="h-4" />
        <NumberOption
          label="Vote Skip Percentage"
          type="percentage"
          defaultValue={50}
          {...voteSkipPercentage}
        />
        <Description>Percentage of users needed for vote to pass.</Description>
        <div className="h-4" />
        <NumberOption
          label="Vote Skip Delay in Seconds"
          type="integer"
          defaultValue={10}
          {...voteSkipDelaySeconds}
        />
        <Description>
          How long video needs to be playing for before vote skipping is allowed.
        </Description>
        <div className="h-4" />
        <ToggleOption
          label="Allow Vote Skipping if Bumper"
          defaultValue={false}
          {...canVoteSkipIfBumper}
        />
        <Description>Allow vote skipping during bumper videos.</Description>
        <div className="h-4" />
        <ToggleOption
          label="Allow Vote Skipping if Paused"
          defaultValue={false}
          {...canVoteSkipIfPaused}
        />
        <Description>Allow vote skipping while stream is paused.</Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
