'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import { SocketEvent, StreamState } from '@/lib/enums'
import parseTimestamp from '@/lib/parseTimestamp'
import Icon from '@/components/ui/Icon'
import styles from './StreamControls.module.scss'

// Admin stream controls
export default function StreamControls() {
  const { socket, streamInfo } = useStreamContext()

  let name = 'Unknown State'
  if (streamInfo.state === StreamState.Playing) name = streamInfo.name
  if (streamInfo.state === StreamState.Paused) name = streamInfo.name
  if (streamInfo.state === StreamState.Loading) name = 'Loading...'
  if (streamInfo.state === StreamState.Error) name = streamInfo.error

  let timestamp = null
  if ('totalSeconds' in streamInfo) timestamp = `${parseTimestamp(streamInfo.currentSeconds)} / ${parseTimestamp(streamInfo.totalSeconds)}`

  const isError = streamInfo.state === StreamState.Error

  return (
    <div className={styles.streamControls}>
      <ActionButton />
      <button className={styles.actionButton} onClick={() => socket.emit(SocketEvent.AdminSkipVideo)}>
        <Icon name="skip" />
      </button>
      <div className={styles.text}>
        <h6 className={isError ? `${styles.name} ${styles.error}` : styles.name} title={name}>{name}</h6>
        {timestamp && <p className={styles.timestamp}>{timestamp}</p>}
      </div>
    </div>
  )
}

function ActionButton() {
  const { socket, streamInfo } = useStreamContext()

  if (streamInfo.state === StreamState.Playing) {
    return (
      <button className={styles.actionButton} onClick={() => socket.emit(SocketEvent.AdminPauseStream)}>
        <Icon name="pause" />
      </button>
    )
  }

  if (streamInfo.state === StreamState.Paused) {
    return (
      <button className={styles.actionButton} onClick={() => socket.emit(SocketEvent.AdminUnpauseStream)}>
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