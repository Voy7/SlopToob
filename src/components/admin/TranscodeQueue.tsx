'use client'

import { useAdminContext } from '@/contexts/AdminContext'
import { JobState } from '@/lib/enums'
import { SettingGroup, Header } from '@/components/admin/SettingsComponents'
import Icon, { IconNames } from '@/components/ui/Icon'
import styles from './QueueList.module.scss'

const states: Record<JobState, { name: string; color: string }> = {
  [JobState.Initializing]: { name: 'Initializing', color: 'gray' },
  [JobState.Idle]: { name: 'Idle', color: 'gray' },
  [JobState.AwaitingTranscode]: { name: 'Awaiting Transcode', color: 'magenta' },
  [JobState.Transcoding]: { name: 'Transcoding', color: 'aqua' },
  [JobState.CleaningUp]: { name: 'Cleaning Up', color: 'orange' },
  [JobState.Finished]: { name: 'Finished', color: 'lime' },
  [JobState.Errored]: { name: 'Errored', color: 'red' }
}

export default function QueueList() {
  const { transcodeQueue } = useAdminContext()

  return (
    <SettingGroup>
      <Header icon="list">Transcoding Jobs ({transcodeQueue.length})</Header>
      <div className={styles.queueItems}>
        {transcodeQueue.map((video, index) => (
          <div key={video.name} className={styles.queueItem}>
            <span className={styles.number}>{index + 1}.</span>
            <div className="">
              <p>as: {video.availableSeconds}</p>
              <div className={styles.state}>
                <div className={styles.dot} style={{ background: states[video.state].color }} />
                <p>{states[video.state].name}</p>
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <StatItem icon="arrow-right">
                  {Math.round((video.availableSeconds / video.totalSeconds) * 100)}%
                </StatItem>
                <StatItem icon="history">{video.fpsRate} FPS</StatItem>
                <StatItem icon="list">{video.frames.toLocaleString()} Frames</StatItem>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingGroup>
  )
}

function StatItem({ icon, children }: { icon: IconNames; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-bg3 px-2 py-1 text-text3">
      <Icon name={icon} />
      {children}
    </div>
  )
}
