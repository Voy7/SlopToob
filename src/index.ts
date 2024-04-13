// Project entry point

import 'colors'
import Settings from '@/stream/Settings'

// Start servers once settings are loaded
Settings.onReady(() => {
  import('@/server/nextServer')
})