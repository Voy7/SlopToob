'use client'

import { useMemo } from 'react'
import { useStreamContext } from '@/contexts/StreamContext'
import { ChatType } from '@/lib/enums'
import Icon, { type IconNames } from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'
import { roleColors } from '@/lib/roleColors'
import type { ChatMessage as ChatMessageType } from '@/typings/socket'

type EventIcon = {
  icon: IconNames
  color?: string
}

const eventIcons: Record<ChatType, EventIcon | null> = {
  [ChatType.UserChat]: null,
  [ChatType.Error]: null,
  [ChatType.Joined]: { icon: 'arrow-right', color: 'aqua' },
  [ChatType.Left]: { icon: 'arrow-left', color: 'aqua' },
  [ChatType.NicknameChange]: { icon: 'edit', color: 'aqua' },
  [ChatType.VotedToSkip]: { icon: 'skip', color: 'aqua' },
  [ChatType.VoteSkipPassed]: { icon: 'skip', color: 'lime' },
  [ChatType.AdminPause]: { icon: 'pause', color: 'rgb(255, 95, 95)' },
  [ChatType.AdminUnpause]: { icon: 'play', color: 'rgb(255, 95, 95)' },
  [ChatType.AdminSkip]: { icon: 'skip', color: 'rgb(255, 95, 95)' },
  [ChatType.AdminPrevious]: { icon: 'previous', color: 'rgb(255, 95, 95)' },
  [ChatType.AdminChangePlaylist]: { icon: 'playlist', color: 'rgb(255, 95, 95)' },
  [ChatType.AdminSyncedSchedule]: { icon: 'calendar', color: 'rgb(255, 95, 95)' }
}

export default function ChatMessage({ chat }: { chat: ChatMessageType & { time: number } }) {
  const { streamInfo } = useStreamContext()

  const [timestamp, fullTimestamp] = useMemo(() => {
    const date = new Date(chat.time)
    return [
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      date.toLocaleString('en-US')
    ]
  }, [chat])

  // Normal user chat message
  if (chat.type === ChatType.UserChat) {
    const nameColor = roleColors[chat.role]
    return (
      <div className="animate-chat-message flex items-start justify-between gap-1 p-1 hover:bg-bg2">
        <div className="flex items-start gap-1.5 overflow-hidden">
          {streamInfo.chat.showIdenticons && (
            <img src={chat.image} alt="" className="h-[1.4rem] w-[1.4rem] rounded-full bg-white" />
          )}
          <p className="overflow-hidden text-ellipsis whitespace-pre-wrap break-words text-base">
            <span style={{ color: nameColor }}>{chat.username}:</span> {chat.message}
          </p>
        </div>
        {streamInfo.chat.showTimestamps && (
          <Timestamp hoverText={fullTimestamp}>{timestamp}</Timestamp>
        )}
      </div>
    )
  }

  // Is error, use different styling
  if (chat.type === ChatType.Error) {
    return (
      <div className="animate-chat-message flex items-start justify-between gap-1 border-l-2 border-red-500 bg-red-500 bg-opacity-25 p-1 pl-2 text-red-200">
        <p>{chat.message}</p>
      </div>
    )
  }

  // Chat event message
  const eventIcon = eventIcons[chat.type]
  return (
    <div className="animate-chat-message flex items-start justify-between gap-1 p-1 hover:bg-bg2">
      {eventIcon && (
        <Icon
          name={eventIcon.icon}
          style={{ color: eventIcon.color }}
          className="mr-[1px] mt-[2px] text-lg"
        />
      )}
      <p className="w-full overflow-hidden text-ellipsis whitespace-pre-wrap break-words text-text2">
        {chat.message}
      </p>
      {streamInfo.chat.showTimestamps && (
        <Timestamp hoverText={fullTimestamp}>{timestamp}</Timestamp>
      )}
    </div>
  )
}

function Timestamp({ hoverText, children }: { hoverText: string; children: string }) {
  return (
    <span className="mt-[1px] cursor-default whitespace-nowrap text-sm text-text3">
      <HoverTooltip placement="top-end">{hoverText}</HoverTooltip>
      {children}
    </span>
  )
}
