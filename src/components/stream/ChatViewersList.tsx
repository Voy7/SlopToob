'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Icon from '@/components/ui/Icon'
import { roleColors } from '@/lib/roleColors'

export default function ChatViewersList({ close }: { close: () => void }) {
  const { streamInfo, viewers } = useStreamContext()

  return (
    <div className="chatViewersListAnimation absolute bottom-0 left-0 max-h-[12rem] w-full translate-y-[calc(100%+0.25rem)] overflow-y-auto rounded-lg border border-border2 bg-bg2 pb-2 shadow-lg md:max-h-[20rem]">
      <header className="mx-2 mb-2 flex items-center justify-between gap-4 border-b border-border2 py-2">
        <h3 className="cursor-default text-xl font-normal text-text1">{viewers.length} Viewers</h3>
        <button
          onClick={close}
          className="flex cursor-pointer items-center justify-center rounded border border-border1 bg-bg2 p-1 text-2xl text-text1 transition-all duration-200 ease-in-out hover:border-border2 hover:bg-bg3">
          <Icon name="close" />
        </button>
      </header>
      <ul>
        {viewers.map((viewer, index) => (
          <li
            key={index}
            className="flex w-full cursor-default items-center gap-2 overflow-hidden px-2 py-1 text-base hover:bg-bg3">
            {streamInfo.chat.showIdenticons && (
              <img src={viewer.image} alt="" className="h-6 w-6 rounded-full bg-white" />
            )}
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: roleColors[viewer.role] }}>
              {viewer.username}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
