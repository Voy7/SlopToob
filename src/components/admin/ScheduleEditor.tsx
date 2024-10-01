'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ScheduleSyncer from '@/components/admin/ScheduleSyncer'
import ScheduleHeader from '@/components/admin/ScheduleHeader'
import ScheduleEntry from '@/components/admin/ScheduleEntry'
import ClickActionsMenu from '@/components/ui/ClickActionsMenu'
import MenuActionButton from '@/components/ui/MenuActionButton'
import type { ScheduleEntryOptions } from '@/typings/types'
import { twMerge } from 'tailwind-merge'

export default function ScheduleEditor() {
  const { schedule } = useAdminContext()
  const { socket } = useSocketContext()

  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [addOptions, setAddOptions] = useState<ScheduleEntryOptions | null>(null)

  function addEntry() {
    console.log(addOptions)
    if (!addOptions) return
    socket.emit(Msg.AdminScheduleAddEntry, addOptions)
    setShowAddModal(false)
  }

  return (
    <>
      <SettingGroup>
        <div className="flex items-center justify-between gap-2">
          <Header icon="calendar">Weekly Schedule</Header>
          <button
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-blue-500 duration-300 hover:underline active:bg-blue-500 active:bg-opacity-50 active:duration-0"
            onClick={() => setShowAddModal(true)}>
            <Icon name="calendar-add" />
            Add Entry
          </button>
        </div>
        {schedule.entries.length ? (
          <div className="my-2 border border-border1">
            {schedule.canBeSynced && (
              <div className="w-full p-2">
                <ScheduleSyncer />
              </div>
            )}
            <div className="w-full overflow-x-auto">
              <ScheduleHeader />
              {schedule.entries.map((entry, index) => (
                <div
                  key={JSON.stringify(entry)}
                  className="animate-fade-in flex w-full min-w-max items-center justify-between gap-4 border-t-[1px] border-border1 pr-1">
                  <ScheduleEntry
                    entry={entry}
                    onChange={(options) => {
                      socket.emit(Msg.AdminScheduleUpdateEntry, { entryID: entry.id, options })
                    }}
                  />
                  <button className="shrink-0 rounded-full p-1.5 text-lg hover:bg-bg3">
                    <Icon name="more" />
                    <ClickActionsMenu placement="right">
                      <MenuActionButton
                        icon="delete"
                        onClick={() => socket.emit(Msg.AdminScheduleDeleteEntry, entry.id)}
                        className="text-red-500 hover:bg-red-500">
                        Delete Entry
                      </MenuActionButton>
                    </ClickActionsMenu>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex w-full cursor-default flex-col items-center justify-center gap-4 py-8 text-lg text-text2">
            <Icon name="calendar" className="text-4xl" />
            No schedule entries yet, Click "Add Entry" below.
            <Button
              variant="main"
              icon="calendar-add"
              className=""
              onClick={() => {
                setShowAddModal(true)
                setAddOptions(null)
              }}>
              Add Entry
            </Button>
          </div>
        )}
      </SettingGroup>

      <Modal
        title="Add Schedule Entry"
        isOpen={showAddModal}
        setClose={() => setShowAddModal(false)}>
        <div className="p-4">
          <p className="mb-8 text-center text-text2">
            Enter the details for the new schedule entry below.
          </p>
          <div className="w-full overflow-x-auto">
            <ScheduleHeader />
            <div className="py-2">
              <ScheduleEntry onChange={(options) => setAddOptions(options)} />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-end gap-2">
            <Button variant="normal" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="main" icon="calendar-add" onClick={addEntry}>
              Save Entry
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
