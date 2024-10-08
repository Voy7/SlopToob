'use client'

import { useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSocketContext } from '@/contexts/SocketContext'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import { Msg, AuthRole, StreamState } from '@/shared/enums'
import Modal from '@/components/ui/Modal'

const VOLUME_STEP_PERCENT = 0.05

export default function StreamKeybinds() {
  const session = useSession()
  const authUser = session.data?.user
  if (!authUser) return null

  const { socket } = useSocketContext()
  const { videoElement, containerElement, showActionPopup, toggleFullscreen } = useVideoContext()
  const {
    streamInfo,
    setShowClearChatModal,
    showKeybindsModal,
    setShowKeybindsModal,
    setShowAdminModal
  } = useStreamContext()

  type KeybindDefinition = {
    key: string[]
    keyLabel: string
    description: string
    action: () => void
  }

  const keybinds: KeybindDefinition[] = useMemo(() => {
    return [
      {
        key: [' '],
        keyLabel: 'Space',
        description: 'Play/Pause video',
        action: () =>
          videoElement.paused ? videoElement.play().catch(() => {}) : videoElement.pause()
      },
      {
        key: ['arrowup'],
        keyLabel: 'Arrow Up',
        description: 'Increase volume by 5%',
        action: () => {
          videoElement.volume = Math.min(videoElement.volume + VOLUME_STEP_PERCENT, 1)
          showActionPopup('volume', `${Math.round(videoElement.volume * 100)}%`)
        }
      },
      {
        key: ['arrowdown'],
        keyLabel: 'Arrow Down',
        description: 'Decrease volume by 5%',
        action: () => {
          videoElement.volume = Math.max(videoElement.volume - VOLUME_STEP_PERCENT, 0)
          showActionPopup('volume', `${Math.round(videoElement.volume * 100)}%`)
        }
      },
      {
        key: ['m'],
        keyLabel: 'M',
        description: 'Toggle mute',
        action: () => {
          videoElement.muted = !videoElement.muted
          showActionPopup(
            videoElement.muted ? 'no-volume' : 'volume',
            videoElement.muted ? 'MUTED' : 'UNMUTED'
          )
        }
      },
      { key: ['f'], keyLabel: 'F', description: 'Toggle fullscreen', action: toggleFullscreen },
      {
        key: ['c'],
        keyLabel: 'C',
        description: 'Clear chat',
        action: () => setShowClearChatModal(true)
      },
      {
        key: ['v'],
        keyLabel: 'V',
        description: 'Vote to skip',
        action: () => {
          const voteSkipButton = document.querySelector('[data-vote-button]') as HTMLElement
          if (voteSkipButton) voteSkipButton.click()
        }
      },
      {
        key: ['a'],
        keyLabel: 'A',
        description: 'Show admin panel (Admins only)',
        action: () => setShowAdminModal(true)
      },
      {
        key: ['j'],
        keyLabel: 'J',
        description: 'Rewind 10 seconds (Admins only)',
        action: () => {
          if (authUser.role < AuthRole.Admin) return
          showActionPopup('back-10', 'Rewind 10s')
          socket.emit(Msg.AdminSeekStepBackward, 10)
        }
      },
      {
        key: ['k'],
        keyLabel: 'K',
        description: 'Pause/Unpause stream (Admins only)',
        action: () => {
          if (authUser.role >= AuthRole.Admin) {
            if (streamInfo.state === StreamState.Playing) {
              showActionPopup('pause', 'Pausing stream')
              socket.emit(Msg.AdminPauseStream)
            } else if (streamInfo.state === StreamState.Paused) {
              showActionPopup('play', 'Unpausing stream')
              socket.emit(Msg.AdminUnpauseStream)
            }
            return
          }
          videoElement.paused ? videoElement.play().catch(() => {}) : videoElement.pause()
        }
      },
      {
        key: ['l'],
        keyLabel: 'L',
        description: 'Fast forward 10 seconds (Admins only)',
        action: () => {
          if (authUser.role < AuthRole.Admin) return
          showActionPopup('forward-10', 'Fast Forward 10s')
          socket.emit(Msg.AdminSeekStepForward, 10)
        }
      },
      {
        key: ['arrowleft'],
        keyLabel: 'Arrow Left',
        description: 'Rewind 5 seconds (Admins only)',
        action: () => {
          if (authUser.role < AuthRole.Admin) return
          showActionPopup('back-5', 'Rewind 5s')
          socket.emit(Msg.AdminSeekStepBackward, 5)
        }
      },
      {
        key: ['arrowright'],
        keyLabel: 'Arrow Right',
        description: 'Fast forward 5 seconds (Admins only)',
        action: () => {
          if (authUser.role < AuthRole.Admin) return
          showActionPopup('forward-5', 'Fast Forward 5s')
          socket.emit(Msg.AdminSeekStepForward, 5)
        }
      },
      {
        key: ['/'],
        keyLabel: 'Slash / L',
        description: 'Show keybinds list',
        action: () => setShowKeybindsModal(true)
      }
    ]
  }, [authUser, streamInfo, videoElement, socket, toggleFullscreen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!containerElement || !videoElement) return

    function keydown(event: KeyboardEvent) {
      // No Ctrl/Alt/Shift keybinds
      if (event.ctrlKey || event.altKey || event.shiftKey) return
      // Only allow keybinds if not typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' &&
        document.activeElement?.getAttribute('type') !== 'range'
      )
        return
      if (document.activeElement?.tagName === 'TEXTAREA') return

      for (const keybind of keybinds) {
        if (!keybind.key.includes(event.key.toLowerCase())) continue
        keybind.action()
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', keydown)

    return () => document.removeEventListener('keydown', keydown)
  }, [containerElement, videoElement, keybinds])

  return (
    <Modal
      title="Keybinds List"
      isOpen={showKeybindsModal}
      setClose={() => setShowKeybindsModal(false)}>
      <p className="px-4 py-6 text-text3">List of keybinds/shortcuts available on this page:</p>
      <ul className="flex list-none flex-col gap-1 px-4 pb-4">
        {keybinds.map((item, index) => (
          <li key={index} className="p-1">
            <span className="mr-1 text-lg text-border3">&bull;</span>
            <strong className="mr-1 rounded-md bg-bg2 p-1 font-normal text-text2">
              {item.keyLabel}
            </strong>{' '}
            {item.description}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
