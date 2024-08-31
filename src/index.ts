// Project entry point

import 'colors'

// Start servers once following checks are passed
async function main() {
  const { checkRequiredVariables } = await import('@/server/EnvVariables')
  await checkRequiredVariables()

  const { default: Settings } = await import('@/server/Settings')
  await Settings.onReady()

  const { default: FileTreeHandler } = await import('@/server/FileTreeHandler')
  await FileTreeHandler.onReady()

  const { default: Schedule } = await import('@/server/stream/Schedule')
  await Schedule.initialize()

  import('@/server/nextServer')
}

main()
