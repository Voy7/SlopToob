'use client'

import { useState } from 'react'
import styles from './Thumbnail.module.scss'

type Props = {
  src: string
  height: number
}

// Video thumbnail component
export default function Thumbnail({ src, height }: Props) {
  const [loaded, setLoaded] = useState<boolean>(false)

  return (
    <div
      className={loaded ? `${styles.thumbnail} ${styles.loaded}` : styles.thumbnail}
      style={{ height: `${height}px` }}
    >
      <img
        src={src}
        onError={(event) => {
          // Fallback to /no-thumbnail.png if the thumbnail fails to load
          event.currentTarget.src = '/no-thumbnail.png'
          setLoaded(true)
        }}
        alt="Thumbnail"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
