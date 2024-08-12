'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import useToggleOption from '@/hooks/useToggleOption'
import {
  SettingGroup,
  Header,
  Description,
  ToggleOption,
  ButtonOption,
  Gap
} from '@/components/admin/SettingsComponents'
import Button from '@/components/ui/Button'
import { ClientCacheStatus } from '@/typings/socket'
import ActionModal from '../ui/ActionModal'
import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { Msg } from '@/lib/enums'

export default function SectionStream() {
  const { videosCacheStatus, bumpersCacheStatus, thumbnailsCacheStatus } = useAdminContext()

  const cacheVideos = useToggleOption('cacheVideos')
  const cacheBumpers = useToggleOption('cacheBumpers')

  return (
    <>
      <h2>Caching</h2>
      <SettingGroup>
        <Header icon="cache">Cache Settings</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
        <Gap />
        <CacheStatus label="Videos" status={videosCacheStatus} />
        <Gap />
        <CacheStatus label="Bumpers" status={bumpersCacheStatus} />
        <Gap />
        <CacheStatus label="Thumbnails" status={thumbnailsCacheStatus} />
      </SettingGroup>
    </>
  )
}

type CacheStatusProps = {
  label: string
  status: ClientCacheStatus
}

function CacheStatus({ label, status }: CacheStatusProps) {
  const { socket } = useSocketContext()
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  function deleteCache() {
    socket.emit(Msg.AdminDeleteCache, status.cacheID)
    setShowDeleteModal(false)
  }

  return (
    <>
      <ButtonOption
        label={`${label} cache: ${status.filesCount} items, Size: ${status.size}`}
        swapped={true}>
        <Button
          style="danger"
          icon={status.isDeleting ? 'loading' : 'delete'}
          active={!status.isDeleting}
          onClick={() => setShowDeleteModal(true)}>
          {status.isDeleting ? 'Deleting...' : 'Clear Cache'}
        </Button>
      </ButtonOption>
      <ActionModal
        title={`Delete ${label} Cache`}
        isOpen={showDeleteModal}
        setClose={() => setShowDeleteModal(false)}
        button={
          <Button style="danger" icon="delete" loading={status.isDeleting} onClick={deleteCache}>
            Delete Cache
          </Button>
        }>
        <p>
          Are you sure you want to <u>permanently delete</u> the {label} cache?
        </p>
        <p>
          Total Size: {status.size}
          <br />
          Total files: {status.filesCount}
        </p>
      </ActionModal>
    </>
  )
}
