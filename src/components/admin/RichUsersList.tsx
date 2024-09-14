'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { AuthRole, Msg } from '@/lib/enums'
import { roleColors } from '@/lib/roleColors'
import Icon from '@/components/ui/Icon'
import HoverTooltip from '@/components/ui/HoverTooltip'
import ClickActionsMenu from '@/components/ui/ClickActionsMenu'
import MenuActionButton from '@/components/ui/MenuActionButton'
import type { ClientRichUser } from '@/typings/socket'
import { useSocketContext } from '@/contexts/SocketContext'

export default function RichUsersList() {
  const { richUsers } = useAdminContext()

  const adminUsers: ClientRichUser[] = []
  const normalUsers: ClientRichUser[] = []

  for (const user of richUsers) {
    if (user.role === AuthRole.Admin) adminUsers.push(user)
    else normalUsers.push(user)
  }

  return (
    <div className="overflow-y-auto p-4">
      <h2 className="mb-4 flex cursor-default items-center gap-2 text-lg font-bold">
        CONNECTED CLIENTS ({richUsers.length})
        <Icon name="users" />
      </h2>
      <Group title="Admins" color={roleColors[AuthRole.Admin]} users={adminUsers} />
      <Group title="Normal Users" color={roleColors[AuthRole.Normal]} users={normalUsers} />
    </div>
  )
}

type GroupProps = {
  title: string
  color: string
  users: ClientRichUser[]
}

function Group({ title, color, users }: GroupProps) {
  const { socket } = useSocketContext()

  return (
    <div className="flex w-full cursor-default flex-col gap-2">
      <h3 className="textbase flex items-center gap-2 uppercase text-text3">
        {title} ({users.length})
        <hr className="flex-grow border-t-[1px] border-border1" />
      </h3>
      {users.length > 0 ? (
        <div className="pb-4">
          {users.map((user) => (
            <div
              key={user.socketID}
              className="animate-fade-in flex w-full cursor-default items-center gap-2 overflow-hidden py-1.5">
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <img
                  src={user.image}
                  alt={user.username}
                  width={24}
                  height={24}
                  className="shrink-0 rounded-full bg-white"
                />
                <p
                  className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ color }}>
                  {user.username}
                </p>
                <div className="flex shrink-0 items-center">
                  {user.isWatching ? (
                    <div className="shrink-0 p-1 text-blue-300">
                      <Icon name="visibility-on" />
                      <HoverTooltip placement="top">Watching Stream</HoverTooltip>
                    </div>
                  ) : (
                    <div className="shrink-0 p-1 text-gray-500">
                      <Icon name="visibility-off" />
                      <HoverTooltip placement="top">Not Watching Stream</HoverTooltip>
                    </div>
                  )}
                  <button className="shrink-0 rounded-full p-1 hover:bg-bg2">
                    <Icon name="more" />
                    <ClickActionsMenu placement="top-end">
                      <MenuActionButton
                        icon="logout"
                        className="text-red-500 hover:bg-red-500"
                        onClick={() => socket.emit(Msg.AdminKickUser, user.socketID)}>
                        Kick / Disconnect
                      </MenuActionButton>
                    </ClickActionsMenu>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="w-full cursor-default p-4 text-center text-text3">
          No {title.toLowerCase()} connected.
        </p>
      )}
    </div>
  )
}
