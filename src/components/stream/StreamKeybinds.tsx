'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useVideoContext } from '@/contexts/VideoContext'
import { useStreamContext } from '@/contexts/StreamContext'
import Modal from '@/components/ui/Modal'

const VOLUME_STEP_PERCENT = 0.05

export default function StreamKeybinds() {
  const session = useSession()
  const authUser = session.data?.user

  const { videoElement, containerElement, showActionPopup, toggleFullscreen } = useVideoContext()
  const { setShowClearChatModal, showKeybindsModal, setShowKeybindsModal, setShowAdminModal } =
    useStreamContext()

  type KeybindDefinition = {
    key: string[]
    keyLabel: string
    description: string
    action: () => void
  }

  const keybinds: KeybindDefinition[] = [
    {
      key: [' ', 'k'],
      keyLabel: 'Space / K',
      description: 'Play/Pause video',
      action: () => (videoElement.paused ? videoElement.play() : videoElement.pause())
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
      key: ['/', 'l'],
      keyLabel: 'Slash / L',
      description: 'Show keybinds list',
      action: () => setShowKeybindsModal(true)
    }
  ]

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
  }, [containerElement, videoElement])

  return (
    <Modal
      title="Keybinds List"
      isOpen={showKeybindsModal}
      setClose={() => setShowKeybindsModal(false)}
    >
      <p className="text-text3 px-4 py-6">List of keybinds/shortcuts available on this page:</p>
      <ul className="flex list-none flex-col gap-1 px-4 pb-4">
        {keybinds.map((item, index) => (
          <li key={index} className="p-1">
            <span className="text-border3 mr-1 text-lg">&bull;</span>
            <strong className="bg-bg2 text-text2 mr-1 rounded-md p-1 font-normal">
              {item.keyLabel}
            </strong>{' '}
            {item.description}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
