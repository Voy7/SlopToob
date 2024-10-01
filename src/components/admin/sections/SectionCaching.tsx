'use client'

import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { Msg } from '@/lib/enums'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import ActionModal from '@/components/ui/ActionModal'
import type { ClientCacheStatus } from '@/typings/socket'

export default function SectionStream() {
  const { videosCacheStatus, bumpersCacheStatus, thumbnailsCacheStatus } = useAdminContext()

  const cacheVideos = useToggleOption('cacheVideos')
  const cacheBumpers = useToggleOption('cacheBumpers')

  return (
    <LoadingBoundary>
      <MainHeader>Caching</MainHeader>
      <SettingGroup>
        <Header icon="cache">Cache Settings</Header>
        <ToggleOption label="Cache Videos" {...cacheVideos} />
        <ToggleOption label="Cache Bumpers" {...cacheBumpers} />
        <Description>Cache videos and bumpers for faster loading times</Description>
      </SettingGroup>
      <SettingGroup>
        <Header icon="files">Cache Storage</Header>
        <CacheStatus label="Videos" status={videosCacheStatus} />
        <div className="h-4" />
        <CacheStatus label="Bumpers" status={bumpersCacheStatus} />
        <div className="h-4" />
        <CacheStatus label="Thumbnails" status={thumbnailsCacheStatus} />
      </SettingGroup>
    </LoadingBoundary>
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
      <div className="grid grid-cols-[1fr,auto] items-center gap-2 rounded-lg border border-border1 p-2">
        <div className="">
          <h3 className="pb-2 text-lg font-bold">{label} Cache</h3>
          {status.videosCount !== undefined ? (
            <>
              <p className="flex items-center gap-1 text-text3">
                <Icon name="video-file" className="" />
                <span className="text-text2">Videos: {status.videosCount}</span>
              </p>
              <p className="flex items-center gap-1 text-text3">
                <Icon name="files" />
                <span className="text-text2">Files (segments): {status.fileCount}</span>
              </p>
            </>
          ) : (
            <p className="flex items-center gap-1 text-text3">
              <Icon name="files" className="" />
              <span className="text-text2">Files: {status.fileCount}</span>
            </p>
          )}
          <p className="flex items-center gap-1 text-text3">
            <Icon name="view" className="" />
            <span className="text-text2">Size: {status.size}</span>
          </p>
        </div>
        <Button
          variant="danger"
          icon={status.isDeleting ? 'loading' : 'delete'}
          disabled={status.isDeleting}
          onClick={() => setShowDeleteModal(true)}>
          {status.isDeleting ? 'Deleting...' : 'Clear Cache'}
        </Button>
      </div>
      <ActionModal
        title={`Delete ${label} Cache`}
        isOpen={showDeleteModal}
        setClose={() => setShowDeleteModal(false)}
        button={
          <Button variant="danger" icon="delete" loading={status.isDeleting} onClick={deleteCache}>
            Delete Cache
          </Button>
        }>
        <p>
          Are you sure you want to <u>permanently delete</u> the {label} cache with {status.size}?
        </p>
      </ActionModal>
    </>
  )
}
