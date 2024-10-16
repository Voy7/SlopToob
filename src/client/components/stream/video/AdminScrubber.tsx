'use client'

import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import parseTimestamp from '@/shared/parseTimestamp'
import { Msg } from '@/shared/enums'
import { useAdminContext } from '@/contexts/AdminContext'

export default function AdminScrubber() {
  const { streamInfo, lastStreamUpdateTimestamp } = useAdminContext()
  const { socket } = useSocketContext()

  const { currentSeconds, totalSeconds } = useStreamTimestamp(streamInfo, lastStreamUpdateTimestamp)

  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [selectedSeconds, setSelectedSeconds] = useState<number>(0)

  const transcodedPercent = streamInfo.transcodedSeconds
    ? (streamInfo.transcodedSeconds / totalSeconds) * 100
    : 0

  // Limit max left/right to avoid overflowing scrubber
  let hoverTimestampPos = (selectedSeconds / totalSeconds) * 100
  if (hoverTimestampPos < 2.5) hoverTimestampPos = 2.5
  if (hoverTimestampPos > 97.5) hoverTimestampPos = 97.5

  return (
    <div
      className="relative h-2 w-full cursor-pointer bg-slate-700 transition-[height] duration-300 ease-in-out hover:h-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const percentage = x / rect.width
        setSelectedSeconds(percentage * totalSeconds)
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const percentage = x / rect.width
        const seconds = percentage * totalSeconds
        socket.emit(Msg.AdminSeekTo, seconds)
      }}>
      <div
        className="pointer-events-none absolute h-full bg-slate-500 transition-[width] duration-150"
        style={{ width: `${transcodedPercent}%` }}
      />
      <div
        className="pointer-events-none absolute h-full border-r-2 border-[rgba(0,0,0,0.25)] bg-blue-500 transition-[width] duration-150"
        style={{ width: `${(currentSeconds / totalSeconds) * 100}%` }}
      />
      {isHovered && (
        <>
          <div
            className="pointer-events-none absolute top-[-20px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-[rgb(63,63,63)] px-2 py-1 text-white shadow-md"
            style={{ left: `${hoverTimestampPos}%` }}>
            {parseTimestamp(selectedSeconds)}
          </div>
          <div
            className="pointer-events-none absolute top-0 h-full w-[2px] -translate-x-1/2 transform bg-black"
            style={{ left: `${(selectedSeconds / totalSeconds) * 100}%` }}
          />
        </>
      )}
    </div>
  )
}
