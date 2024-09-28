'use client'

import useToggleOption from '@/hooks/useToggleOption'
import useNumberOption from '@/hooks/useNumberOption'
import {
  MainHeader,
  SettingGroup,
  Description,
  Header,
  ToggleOption,
  NumberOption,
  Gap
} from '@/components/admin/SettingsComponents'

export default function SectionTranscoding() {
  const maxTranscodingJobs = useNumberOption('maxTranscodingJobs')

  return (
    <>
      {/* <MainHeader>Transcoding</MainHeader> */}
      <SettingGroup>
        <Header icon="settings">Transcoder Settings</Header>
        <NumberOption label="Max Transcoding Jobs" type="integer" {...maxTranscodingJobs} />
        <Description>
          Maximum number of transcoding jobs that can run at once.
          <br />
          Recommended: 2 - 3, use 1 if server has performance issues.
        </Description>
      </SettingGroup>
    </>
  )
}
