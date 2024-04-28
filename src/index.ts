// Project entry point

import 'colors'
import Settings from '@/stream/Settings'
import FileTree from '@/stream/FileTreeHandler'

// Start servers once settings are loaded
Settings.onReady(() => {
  FileTree.onReady(() => {
    import('@/server/nextServer')
  })
})