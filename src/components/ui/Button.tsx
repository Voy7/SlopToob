'use client'

import Icon, { IconNames } from '@/components/ui/Icon'
import styles from './Button.module.scss'

type ButtonStyles =
  | 'main'
  | 'normal'
  | 'normal-highlight'
  | 'danger'

type Props = {
  style: ButtonStyles,
  onClick?: React.MouseEventHandler<HTMLButtonElement>,
  active?: boolean,
  loading?: boolean,
  isSubmit?: boolean,
  icon?: IconNames,
} & React.ComponentProps<'button'>

// Fancy button component
export default function Buttons({ style, onClick, active, loading, isSubmit, icon, className, children, ...props }: Props) {
  const classNames = [
    styles.button,
    styles[style],
    className && className,
    active === false && styles.disabled,
    loading && styles.loading
  ].join(' ')
  return (
    <button
      type={isSubmit ? 'submit' : 'button'}
      className={classNames}
      onClick={onClick && onClick}
      {...props}
    >
      <>
        <div className={styles.text}>
          {icon && <Icon name={icon} />}
          <div>{children}</div>
        </div>
        { loading && (
          <div className={styles.loadingContainer}>
            <Icon name="loading" />
          </div>
        )}
      </>
    </button>
  )
}