// Project entry point

import 'colors'

// Start servers once following checks are passed
async function main() {
  const { checkRequiredVariables } = await import('@/server/core/EnvVariables')
  await checkRequiredVariables()

  const { default: Settings } = await import('@/server/core/Settings')
  await Settings.onReady()

  const { default: FileTreeHandler } = await import('@/server/stream/FileTreeHandler')
  await FileTreeHandler.onReady()

  const { default: Schedule } = await import('@/server/stream/Schedule')
  await Schedule.initialize()

  import('@/server/network/nextServer')
}

main()
