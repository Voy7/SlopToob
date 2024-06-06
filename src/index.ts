// Project entry point

import 'colors'
import packageJSON from '@package' assert { type: 'json' }

console.log(`\n  Starting up SlopToob v${packageJSON.version}...\n`.cyan)

// Start servers once following checks are passed
async function main() {
  const { checkRequiredVariables } = await import('@/EnvVariables')
  checkRequiredVariables()

  const { default: Settings } = await import('@/stream/Settings')
  await Settings.onReady()
  
  const { default: FileTreeHandler } = await import('@/stream/FileTreeHandler')
  await FileTreeHandler.onReady()

  import('@/server/nextServer')
}

main()