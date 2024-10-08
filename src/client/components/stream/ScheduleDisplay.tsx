'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import Thumbnail from '@/components/stream/Thumbnail'
import { twMerge } from 'tailwind-merge'

export default function ScheduleDisplay() {
  const { scheduleDisplay } = useStreamContext()

  if (!scheduleDisplay) return null

  return (
    <div className="m-4 rounded-xl bg-bg2 p-4">
      <h2 className="flex w-full items-center gap-1 overflow-hidden whitespace-nowrap text-xl font-medium">
        <Icon name="calendar" className="shrink-0" />
        <span className="overflow-hidden text-ellipsis">Weekly Playlist Schedule</span>
        <span className="overflow-hidden text-ellipsis text-base text-text3">
          &bull; {scheduleDisplay.inSync ? 'Is Active' : 'Currently Not Active'}
        </span>
      </h2>
      <div className="mt-2 flex w-full items-start justify-between overflow-x-auto">
        {scheduleDisplay.entries.map((entry, index) => (
          <div
            key={index}
            className={twMerge(
              'flex cursor-default flex-col items-start',
              index !== scheduleDisplay.entries.length - 1 && 'w-full min-w-[240px]'
            )}>
            <h3 className="flex items-center gap-1 whitespace-nowrap text-xl uppercase text-text2">
              {entry.day}
              {entry.timemark && (
                <span className="text-base text-text3">&bull; {entry.timemark}</span>
              )}
            </h3>
            <div className="flex w-full shrink-0 items-center">
              <div
                className={twMerge(
                  'relative h-[115px] w-[204px] shrink-0 overflow-hidden rounded-xl border-2 border-border1 bg-bg3 shadow-lg',
                  index === scheduleDisplay.activeEntryIndex && 'border-blue-500'
                )}>
                <Thumbnail src={entry.thumbnailURL} height={115} />
                <div className="schedule-vertical-dark-gradient absolute bottom-0 left-0 flex h-[3.5rem] w-full items-center overflow-hidden px-1.5 pt-2 text-base text-white">
                  <p
                    title={entry.playlist}
                    className="m-auto w-full overflow-hidden text-ellipsis text-left leading-5">
                    {entry.playlist}
                  </p>
                </div>
              </div>
              {index !== scheduleDisplay.entries.length - 1 && (
                <div className="h-[4px] w-full bg-gray-800" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
