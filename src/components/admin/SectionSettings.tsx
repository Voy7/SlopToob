'use client'

import { useState } from 'react'
import SubSectionSelector from '@/components/ui/SubSectionSelector'
import TranscodingSettings from '@/components/admin/settings/TranscodingSettings'
import ChatSettings from '@/components/admin/settings/ChatSettings'
import HistorySettings from '@/components/admin/settings/HistorySettings'
import VoteSkipSettings from '@/components/admin/settings/VoteSkipSettings'
import AdvancedSettings from '@/components/admin/settings/AdvancedSettings'
import { MainHeader } from '@/components/admin/SettingsComponents'

export default function SectionSettings() {
  const [subSection, setSubSection] = useState('transcoding')

  return (
    <>
      <MainHeader>Settings</MainHeader>
      <SubSectionSelector
        value={subSection}
        setValue={setSubSection}
        sections={[
          { id: 'transcoding', label: 'Transcoding', icon: 'files' },
          { id: 'chat', label: 'Chat', icon: 'chat' },
          { id: 'history', label: 'History', icon: 'history' },
          { id: 'voteSkip', label: 'Vote Skip', icon: 'skip' },
          { id: 'advanced', label: 'Advanced', icon: 'settings' }
        ]}
      />
      {subSection === 'transcoding' && <TranscodingSettings />}
      {subSection === 'chat' && <ChatSettings />}
      {subSection === 'history' && <HistorySettings />}
      {subSection === 'voteSkip' && <VoteSkipSettings />}
      {subSection === 'advanced' && <AdvancedSettings />}
    </>
  )
}
