'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import ButtonOption from '@/components/admin/common/ButtonOption'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'

export default function HistorySettings() {
  const { historyStatus } = useAdminContext()
  const { socket } = useSocketContext()

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false)

  function clearHistory() {
    socket.emit(Msg.AdminDeleteHistory)
    setShowHistoryModal(false)
  }

  const historyMaxItems = useNumberOption('historyMaxItems')
  const historyDisplayEnabled = useToggleOption('historyDisplayEnabled')
  const historyDisplayItems = useNumberOption('historyDisplayItems')
  const historyDisplayBumpers = useToggleOption('historyDisplayBumpers')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="video-file">Shuffle History Settings</Header>
        <NumberOption label="Shuffle History Max Items" type="integer" {...historyMaxItems} />
        <Description>
          Maximum number of videos to keep in internal history for smart-shuffle logic.
        </Description>
        <div className="h-4" />
        <ButtonOption
          label={`Internal history usage: ${historyStatus.currentCount.toLocaleString()} / ${historyStatus.totalCount.toLocaleString()}`}
          swapped>
          <Button
            variant="danger"
            icon="delete"
            loading={historyStatus.isDeleting}
            onClick={() => setShowHistoryModal(true)}>
            Clear History
          </Button>
          <ActionModal
            title="Clear History"
            isOpen={showHistoryModal}
            setClose={() => setShowHistoryModal(false)}
            button={
              <Button
                variant="danger"
                icon="delete"
                loading={historyStatus.isDeleting}
                onClick={clearHistory}>
                Clear History
              </Button>
            }>
            <p>Are you sure you want to clear the history?</p>
          </ActionModal>
        </ButtonOption>
      </SettingGroup>
      <div className="h-4" />
      <SettingGroup>
        <Header icon="history">History Display Settings</Header>
        <ToggleOption label="Enable History Display" {...historyDisplayEnabled} />
        <Description>Show a list of previously played videos under the video player.</Description>
        <div className="h-4" />
        <NumberOption label="History Display Items" type="integer" {...historyDisplayItems} />
        <Description>Number of videos to display in the stream history list.</Description>
        <div className="h-4" />
        <ToggleOption label="Display Bumpers in History" {...historyDisplayBumpers} />
        <Description>Includes bumpers in the history list.</Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
