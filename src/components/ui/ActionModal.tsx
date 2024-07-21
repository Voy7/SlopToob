'use client'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import styles from './ActionModal.module.scss'

type Props = {
  width?: number
  button: React.ReactNode
  error?: string | null
  formOnSubmit?: React.FormEventHandler<HTMLFormElement>
} & Parameters<typeof Modal>[0]

// Action variant of Modal
export default function ActionModal({
  width = 500,
  button,
  error,
  formOnSubmit,
  ...modalProps
}: Props) {
  const Wrapper = formOnSubmit ? 'form' : 'div'

  return (
    <Modal {...modalProps}>
      <Wrapper
        className={styles.actionModal}
        style={{ width: `min(100%, ${width}px)` }}
        // @ts-expect-error - onSubmit is only defined if it exists, so this would be a form
        onSubmit={formOnSubmit}
      >
        {modalProps.children}
        <div className={styles.buttons}>
          <Button style="normal" onClick={() => modalProps.setClose()}>
            Cancel
          </Button>
          {button}
        </div>
        {error && (
          <p className={styles.error}>
            <Icon name="warning" />
            {error}
          </p>
        )}
      </Wrapper>
    </Modal>
  )
}
