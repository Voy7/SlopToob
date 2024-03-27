'use client'

import Icon from '@/components/ui/Icon'
import styles from './FilePicker.module.scss'
import type { FileTree } from '@/typings/types'


type Props = {
  tree: FileTree
}

export default function FilePicker({ tree }: Props) {
  return (
    <div className={styles.filePicker}>
      <TreeItem item={tree} depth={0} />
    </div>
  )
}

function TreeItem({ item, depth }: { item: FileTree, depth: number }) {
  return (
    <div className={styles.treeItem}>
      <div className={styles.item}>
        <input type="checkbox" />
        <Icon name={item.isDirectory ? 'folder' : 'video-file'} />
        <span>{item.name}</span>
      </div>
      {item.children && item.children.map(child => (
        <TreeItem key={child.path} item={child} depth={depth + 1} />
      ))}
    </div>
  )
}