'use client'

import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import SettingGroup from '@/components/admin/common/SettingGroup'
import Header from '@/components/admin/common/Header'
import Description from '@/components/admin/common/Description'
import { NumberOption, useNumberOption } from '@/components/admin/common/NumberOption'

export default function TranscodingSettings() {
  const maxTranscodingJobs = useNumberOption('maxTranscodingJobs')

  return (
    <LoadingBoundary>
      <SettingGroup>
        <Header icon="settings">Transcoder Settings</Header>
        <NumberOption label="Max Transcoding Jobs" type="integer" {...maxTranscodingJobs} />
        <Description>
          Maximum number of transcoding jobs that can run at once.
          <br />
          Recommended: 2 - 3, use 1 if server has performance issues.
        </Description>
      </SettingGroup>
    </LoadingBoundary>
  )
}
