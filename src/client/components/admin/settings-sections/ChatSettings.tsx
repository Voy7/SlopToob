'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'

export default function ChatSettings() {
  const chatMaxLength = useNumberOption('chatMaxLength')

  const showChatTimestamps = useToggleOption('showChatTimestamps')
  const showChatIdenticons = useToggleOption('showChatIdenticons')

  const sendJoinedStream = useToggleOption('sendJoinedStream')
  const sendLeftStream = useToggleOption('sendLeftStream')
  const sendChangedNickname = useToggleOption('sendChangedNickname')
  const sendVotedToSkip = useToggleOption('sendVotedToSkip')
  const sendVoteSkipPassed = useToggleOption('sendVoteSkipPassed')
  const sendAdminPause = useToggleOption('sendAdminPause')
  const sendAdminUnpause = useToggleOption('sendAdminUnpause')
  const sendAdminSkip = useToggleOption('sendAdminSkip')
  const sendAdminPrevious = useToggleOption('sendAdminPrevious')
  const sendAdminChangePlaylist = useToggleOption('sendAdminChangePlaylist')
  const snedAdminSyncedSchedule = useToggleOption('sendAdminSyncedSchedule')

  const nicknameOnlyAlphanumeric = useToggleOption('nicknameOnlyAlphanumeric')
  const nicknameMinLength = useNumberOption('nicknameMinLength')
  const nicknameMaxLength = useNumberOption('nicknameMaxLength')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="chat">User Chat Messages</Header>
        <NumberOption
          label="Maximum Message Length"
          type="integer"
          defaultValue={120}
          {...chatMaxLength}
        />
        <Description>Maximum amount of characters in a chat message.</Description>
      </SettingGroup>
      <div className="h-4" />
      <SettingGroup>
        <Header icon="view">Chat Elements</Header>
        <ToggleOption label="Display Timestamps" defaultValue={true} {...showChatTimestamps} />
        <ToggleOption label="Display Identicons" defaultValue={true} {...showChatIdenticons} />
        <Description>Display timestamps and identicons in chat.</Description>
      </SettingGroup>
      <div className="h-4" />
      <SettingGroup>
        <Header icon="list">Event Messages</Header>
        <ToggleOption label="User Joined Stream" defaultValue={true} {...sendJoinedStream} />
        <ToggleOption label="User Left Stream" defaultValue={true} {...sendLeftStream} />
        <ToggleOption label="User Changed Nickname" defaultValue={true} {...sendChangedNickname} />
        <ToggleOption label="User Voted to Skip" defaultValue={true} {...sendVotedToSkip} />
        <ToggleOption label="Vote Skip Passed" defaultValue={true} {...sendVoteSkipPassed} />
        <ToggleOption label="Admin Paused Stream" defaultValue={true} {...sendAdminPause} />
        <ToggleOption label="Admin Unpaused Stream" defaultValue={true} {...sendAdminUnpause} />
        <ToggleOption label="Admin Skipped Video" defaultValue={true} {...sendAdminSkip} />
        <ToggleOption
          label="Admin Played Previous Video"
          defaultValue={true}
          {...sendAdminPrevious}
        />
        <ToggleOption
          label="Admin Changed Active Playlist"
          defaultValue={true}
          {...sendAdminChangePlaylist}
        />
        <ToggleOption
          label="Admin Synced Playlist Scheduler"
          defaultValue={true}
          {...snedAdminSyncedSchedule}
        />
        <Description>Send a message when an event occurs.</Description>
      </SettingGroup>
      <div className="h-4" />
      <SettingGroup>
        <Header icon="user">Chat Nicknames</Header>
        <ToggleOption label="Only Alphanumeric" defaultValue={true} {...nicknameOnlyAlphanumeric} />
        <Description>
          Can nickname only contain letters, numbers, underscores, and spaces.
        </Description>
        <div className="h-4" />
        <NumberOption
          label="Minimum Length"
          type="integer"
          defaultValue={3}
          {...nicknameMinLength}
        />
        <NumberOption
          label="Maximum Length"
          type="integer"
          defaultValue={20}
          {...nicknameMaxLength}
        />
        <Description>Minimum and maximum amount of characters in nicknames.</Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
