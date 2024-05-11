'use client'

import { useStreamContext } from '@/contexts/StreamContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from './KeybindsListModal.module.scss'

const keybindsList: { key: string, action: string }[] = [
  { key: 'Space / K', action: 'Play/Pause video' },
  { key: 'Arrow Up', action: 'Increase volume by 10%' },
  { key: 'Arrow Down', action: 'Decrease volume by 10%' },
  { key: 'M', action: 'Toggle mute' },
  { key: 'F', action: 'Toggle fullscreen' },
  { key: 'C', action: 'Clear chat' },
  { key: 'V', action: 'Vote to skip' },
  { key: 'L', action: 'Show keybinds list' },
]

// List of keybinds/shortcuts
export default function KeybindsListModal() {
  const { showKeybindsModal, setShowKeybindsModal } = useStreamContext()

  return (
    <Modal title="Keybinds List" isOpen={showKeybindsModal} setClose={() => setShowKeybindsModal(false)}>
      <p className={styles.topLabel}>List of keybinds/shortcuts available on this page:</p>
      <ul className={styles.keybindsList}>
        {keybindsList.map((item, index) => (
          <li key={index}><span>&bull;</span> <strong>{item.key}</strong> {item.action}</li>
        ))}
      </ul>
    </Modal>
  )
}