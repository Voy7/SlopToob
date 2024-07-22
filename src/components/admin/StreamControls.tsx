'use client'

import { useSocketContext } from '@/contexts/SocketContext'
import { useAdminContext } from '@/contexts/AdminContext'
import { Msg, StreamState } from '@/lib/enums'
import useStreamTimestamp from '@/hooks/useStreamTimestamp'
import Icon from '@/components/ui/Icon'
import styles from './StreamControls.module.scss'

// Admin stream controls
export default function StreamControls() {
  const { socket } = useSocketContext()
  const { streamInfo, lastReceivedPlaylistsDate } = useAdminContext()

  const { currentTimestamp, totalTimestamp } = useStreamTimestamp(
    streamInfo,
    lastReceivedPlaylistsDate
  )

  let name = 'Unknown State'
  if ('name' in streamInfo && streamInfo.name) name = streamInfo.name
  if (streamInfo.state === StreamState.Error) name = streamInfo.error

  const isError = streamInfo.state === StreamState.Error

  return (
    <div className={styles.streamControls}>
      <ActionButton />
      <button className={styles.actionButton} onClick={() => socket.emit(Msg.AdminSkipVideo)}>
        <Icon name="skip" />
      </button>
      <div className={styles.text}>
        <h6 className={isError ? `${styles.name} ${styles.error}` : styles.name} title={name}>
          {name}
        </h6>
        <p className={styles.timestamp}>
          {currentTimestamp} / {totalTimestamp}
        </p>
      </div>
    </div>
  )
}

function ActionButton() {
  const { socket } = useSocketContext()
  const { streamInfo } = useAdminContext()

  if (streamInfo.state === StreamState.Playing) {
    return (
      <button className={styles.actionButton} onClick={() => socket.emit(Msg.AdminPauseStream)}>
        <Icon name="pause" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return (
      <button className={styles.actionButton} onClick={() => socket.emit(Msg.AdminUnpauseStream)}>
        <Icon name="play" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Error) {
    return (
      <button className={`${styles.actionButton} ${styles.error}`}>
        <Icon name="warning" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Loading) {
    return (
      <button className={`${styles.actionButton} ${styles.loading}`}>
        <Icon name="loading" />
      </button>
    )
  }
}
