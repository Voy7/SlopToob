// Project entry point

import 'colors'
import packageJSON from '@package' assert { type: 'json' }

console.log(`\n  Starting up SlopToob v${packageJSON.version}...\n`.cyan)


// Start servers once settings are loaded
async function main() {
  const { default: Settings } = await import('@/stream/Settings')
  const { default: FileTree } = await import('@/stream/FileTreeHandler')

  Settings.onReady(() => {
    FileTree.onReady(() => {
      import('@/server/nextServer')
    })
  })
}

main()