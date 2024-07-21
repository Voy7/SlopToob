'use client'

import { useState } from 'react'
import { useAdminContext } from '@/contexts/AdminContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { Msg } from '@/lib/enums'
import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'
import {
  SettingGroup,
  Description,
  Header,
  ToggleOption,
  NumberOption,
  Gap,
  ButtonOption
} from '@/components/admin/SettingsComponents'

export default function SectionHistory() {
  const { historyStatus } = useAdminContext()
  const { socket } = useStreamContext()
  if (!historyStatus) return null

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
    <>
      <h2>History</h2>
      <SettingGroup>
        <Header icon="video-file">Shuffle History Settings</Header>
        <NumberOption label="Shuffle History Max Items" type="integer" {...historyMaxItems} />
        <Description>
          Maximum number of videos to keep in internal history for smart-shuffle logic.
        </Description>
        <Gap />
        <ButtonOption
          label={`Internal history usage: ${historyStatus.currentCount} / ${historyStatus.totalCount}`}
          swapped
        >
          <Button
            style="danger"
            icon="delete"
            loading={historyStatus.isDeleting}
            onClick={() => setShowHistoryModal(true)}
          >
            Clear History
          </Button>
          <ActionModal
            title="Clear History"
            isOpen={showHistoryModal}
            setClose={() => setShowHistoryModal(false)}
            button={
              <Button
                style="danger"
                icon="delete"
                loading={historyStatus.isDeleting}
                onClick={clearHistory}
              >
                Clear History
              </Button>
            }
          >
            <p>Are you sure you want to clear the history?</p>
          </ActionModal>
        </ButtonOption>
      </SettingGroup>
      <SettingGroup>
        <Header icon="history">History Display Settings</Header>
        <ToggleOption label="Enable History Display" {...historyDisplayEnabled} />
        <Gap />
        <NumberOption label="History Display Items" type="integer" {...historyDisplayItems} />
        <Description>Number of videos to display in the stream history list.</Description>
        <Gap />
        <ToggleOption label="Display Bumpers in History" {...historyDisplayBumpers} />
        <Description>Includes bumpers in the history list.</Description>
      </SettingGroup>
    </>
  )
}
