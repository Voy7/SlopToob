import styles from './Slider.module.scss'

type Props = {
  value: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

// Settings slider input component
export default function Slider({ value, onChange }: Props) {
  return (
    <div className={styles.switch}>
      <input type="checkbox" checked={value} onChange={onChange} />
      <span className={styles.slider}></span>
    </div>
  )
}
