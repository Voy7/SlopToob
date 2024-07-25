// Project entry point

import 'colors'

// Start servers once following checks are passed
async function main() {
  const { checkRequiredVariables } = await import('@/EnvVariables')
  await checkRequiredVariables()

  const { default: Settings } = await import('@/stream/Settings')
  await Settings.onReady()

  const { default: FileTreeHandler } = await import('@/stream/FileTreeHandler')
  await FileTreeHandler.onReady()

  import('@/server/nextServer')
}

main()
