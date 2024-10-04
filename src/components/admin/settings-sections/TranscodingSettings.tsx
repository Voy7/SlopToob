'use client'

import { useState } from 'react'
import { useSocketContext } from '@/contexts/SocketContext'
import { videoQualities } from '@/lib/videoQualities'
import { audioQualities } from '@/lib/audioQualities'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'
import { ToggleOption, useToggleOption } from '@/components/admin/common/ToggleOption'
import SelectDropdown from '@/components/ui/SelectDropdown'
import SelectItem from '@/components/ui/SelectItem'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Msg } from '@/lib/enums'

export default function TranscodingSettings() {
  const { socket } = useSocketContext()

  const [showRefreshModal, setShowRefreshModal] = useState<boolean>(false)
  const [autoShown, setAutoShown] = useState<boolean>(false)

  function refreshTranscodedFiles() {
    socket.emit(Msg.AdminApplyTranscoderChanges)
    setShowRefreshModal(false)
    setAutoShown(false)
  }

  // Modify the "setValue" for some settings so that the "showRefreshModal" is shown
  function showOnChange(setValue: Function) {
    return (value: any) => {
      setValue(value)
      if (autoShown) return
      setAutoShown(true)
      setShowRefreshModal(true)
    }
  }

  const maxTranscodingJobs = useNumberOption('maxTranscodingJobs')

  const maxVideoQuality = useNumberOption('maxVideoQuality')
  const maxAudioQuality = useNumberOption('maxAudioQuality')

  const enableVolumeNormalization = useToggleOption('enableVolumeNormalization')
  const loudnormTargetIntegrated = useNumberOption('loudnormTargetIntegrated')
  const loudnormTargetPeak = useNumberOption('loudnormTargetPeak')
  const loudnormRange = useNumberOption('loudnormRange')

  if (maxVideoQuality.value === null) return <div data-loading />
  if (maxAudioQuality.value === null) return <div data-loading />

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="settings">Transcoding Jobs</Header>
        <NumberOption
          label="Max Transcoding Jobs"
          type="integer"
          defaultValue={2}
          {...maxTranscodingJobs}
        />
        <Description>
          Maximum number of transcoding jobs that can run at once.
          <br />
          Recommended: 2 - 3, use 1 if server has performance issues.
        </Description>
      </SettingGroup>
      <div className="h-4" />
      <div className="h-4" />
      <SettingGroup>
        <Header icon="settings">Transcoder Quality & Filters</Header>
        <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:gap-8">
          <p className="text-text2">
            <span className="text-red-400">
              NOTE: Any changes made to the transcoder settings will not apply to videos that have
              already been transcoded, or are in the process of being transcoded.
            </span>
            <br />
            To apply the changes to existing videos, click "Delete Transcoded Files". This will
            reset all transcoding jobs and delete all cached video files.
          </p>
          <Button variant="danger" icon="refresh" onClick={() => setShowRefreshModal(true)}>
            Delete Transcoded Files
          </Button>
        </div>
        <div className="h-8" />
        <div className="grid-cols-2 gap-8 lg:grid">
          <div>
            <SelectDropdown
              label={`Max Video Quality: ${videoQualities[maxVideoQuality.value].name}`}
              icon="video-file">
              {videoQualities.map((quality, index) => (
                <SelectItem
                  key={quality.id}
                  active={index === maxVideoQuality.value}
                  label={quality.name}
                  onClick={showOnChange(() => maxVideoQuality.setValue(index))}
                  className="py-1.5"
                />
              ))}
            </SelectDropdown>
            <Description>
              Maximum video quality for transcoding.
              <br />
              Higher quality requires more server resources.
            </Description>
          </div>
          <div className="h-4 lg:hidden" />
          <div>
            <SelectDropdown
              label={`Max Audio Bitrate: ${audioQualities[maxAudioQuality.value].name}`}
              icon="volume">
              {audioQualities.map((quality, index) => (
                <SelectItem
                  key={quality.id}
                  active={index === maxAudioQuality.value}
                  label={quality.name}
                  onClick={showOnChange(() => maxAudioQuality.setValue(index))}
                  className="py-1.5"
                />
              ))}
            </SelectDropdown>
            <Description>
              Maximum audio quality for transcoding.
              <br />
              Higher quality requires more server resources.
            </Description>
          </div>
        </div>
        <div className="h-8" />
        <ToggleOption
          label="Enable Volume Normalization"
          defaultValue={false}
          {...enableVolumeNormalization}
          setValue={showOnChange(enableVolumeNormalization.setValue)}
        />
        <Description>
          Normalize audio volume to ensure consistent loudness between all videos.
          <br />
          The normalization algorithm used is the{' '}
          <a
            href="https://en.wikipedia.org/wiki/EBU_R_128"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline">
            EBU R128 loudness normalization
          </a>{' '}
          standard.
        </Description>
        <div className="h-4" />
        <NumberOption
          label="Target Integrated"
          type="float"
          defaultValue={-24}
          {...loudnormTargetIntegrated}
          setValue={showOnChange(loudnormTargetIntegrated.setValue)}
        />
        <NumberOption
          label="Target Peak"
          type="float"
          defaultValue={-2}
          {...loudnormTargetPeak}
          setValue={showOnChange(loudnormTargetPeak.setValue)}
        />
        <NumberOption
          label="Loudness Range"
          type="integer"
          defaultValue={7}
          {...loudnormRange}
          setValue={showOnChange(loudnormRange.setValue)}
        />
        <Description>
          Advanced volume normalization parameters, default values should work for most cases.
        </Description>
      </SettingGroup>
      <Modal
        title="Apply Transcoding Changes"
        isOpen={showRefreshModal}
        setClose={() => setShowRefreshModal(false)}>
        <div className="max-w-[450px] p-4">
          <p className="mb-4 text-red-400">
            NOTE: Any changes made to the transcoder settings will not apply to videos that have
            already been transcoded, or are in the process of being transcoded.
          </p>
          <div className="flex w-full items-center justify-center">
            <p className="text-text2">
              By clicking "Delete Transcoded Files":
              <br />
              <span className="text-text4">&bull;</span> All transcoding jobs will be reset.
              <br />
              <span className="text-text4">&bull;</span> Videos cache will be deleted.
              <br />
              <span className="text-text4">&bull;</span> Bumpers cache will be deleted.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 border-t border-border1 pt-4">
            <Button variant="normal" icon="close" onClick={() => setShowRefreshModal(false)}>
              Dismiss
            </Button>
            <Button variant="danger" icon="refresh" onClick={refreshTranscodedFiles}>
              Delete Transcoded Files
            </Button>
          </div>
        </div>
      </Modal>
    </LoadingBoundary>
  )
}
