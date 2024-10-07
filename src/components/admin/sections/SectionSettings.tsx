'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import LoadingBoundary from '@/components/admin/common/LoadingBoundary'
import MainHeader from '@/components/admin/common/MainHeader'
import SubSectionSelector from '@/components/ui/SubSectionSelector'
import TranscodingSettings from '@/components/admin/settings-sections/TranscodingSettings'
import BumpersSettings from '@/components/admin/settings-sections/BumpersSettings'
import ChatSettings from '@/components/admin/settings-sections/ChatSettings'
import ScheduleSettings from '@/components/admin/settings-sections/ScheduleSettings'
import HistorySettings from '@/components/admin/settings-sections/HistorySettings'
import VoteSkipSettings from '@/components/admin/settings-sections/VoteSkipSettings'
import AdvancedSettings from '@/components/admin/settings-sections/AdvancedSettings'

export default function SectionSettings() {
  const { settingsSubSection, setSettingsSubSection } = useAdminContext()

  return (
    <div className="animate-section">
      <MainHeader>Settings</MainHeader>
      <SubSectionSelector
        value={settingsSubSection}
        setValue={setSettingsSubSection}
        sections={[
          { id: 'transcoding', label: 'Transcoding', icon: 'files' },
          { id: 'bumpers', label: 'Bumpers', icon: 'bumper' },
          { id: 'chat', label: 'Chat', icon: 'chat' },
          { id: 'schedule', label: 'Schedule', icon: 'calendar' },
          { id: 'history', label: 'History', icon: 'history' },
          { id: 'voteSkip', label: 'Vote Skip', icon: 'skip' },
          { id: 'advanced', label: 'Advanced', icon: 'settings' }
        ]}
      />
      {settingsSubSection === 'transcoding' && <TranscodingSettings />}
      {settingsSubSection === 'bumpers' && <BumpersSettings />}
      {settingsSubSection === 'chat' && <ChatSettings />}
      {settingsSubSection === 'schedule' && <ScheduleSettings />}
      {settingsSubSection === 'history' && <HistorySettings />}
      {settingsSubSection === 'voteSkip' && <VoteSkipSettings />}
      {settingsSubSection === 'advanced' && <AdvancedSettings />}
    </div>
  )
}
