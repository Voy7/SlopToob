import fsAsync from 'fs/promises'

// SCUFFED ALERT! TODO: Figure out how to make this not exist.
// Attempt to delete dir x times with y interval
// Sometimes ffmpeg or another thread is still using the directory
// and throwing BUSY errors, usually they let go after a second, so this should work
const TRY_TIMES = 5
const TRY_INTERVAL_MS = 500

export default async function rmDirRetry(dir: string): Promise<void> {
  for (let i = 0; i < TRY_TIMES; i++) {
    try {
      await fsAsync.rm(dir, { recursive: true, force: true })
      return
    } catch (error) {
      if (i === TRY_TIMES - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, TRY_INTERVAL_MS))
    }
  }
}
