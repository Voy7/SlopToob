import path from 'path'
import fs from 'fs'
import fsAsync from 'fs/promises'

// Utility to watch directory and emit added & deleted files events
export default class FsWatcher {
  private dirPath: string
  private isActive: boolean = false
  private newFileCallback?: (filePath: string) => void
  private deleteFileCallback?: (filePath: string) => void

  constructor(dirPath: string) {
    this.dirPath = dirPath
  }

  // Start watching directory, run this after event listeners are set
  activate() {
    if (this.isActive) return
    this.isActive = true

    fs.watch(this.dirPath, { recursive: true }, (event, filename) => {
      if (!filename) return

      const fullPath = `${this.dirPath}/${filename}`.replace(/\\/g, '/')
      if (event === 'change') return
      if (event === 'rename') {
        if (fs.existsSync(fullPath)) this.newFileCallback?.(fullPath)
        else this.deleteFileCallback?.(fullPath)
      }
    })
  }

  // Crawl entire tree and emit new file event for each file
  async emitAllCurrentFiles() {
    const getFiles = async (dirPath: string) => {
      const files = await fsAsync.readdir(dirPath, { withFileTypes: true })
      for (const file of files) {
        if (file.isDirectory()) {
          await getFiles(path.join(dirPath, file.name))
          continue
        }
        const fullPath = path.join(dirPath, file.name)
        this.newFileCallback?.(fullPath)
      }
    }

    return await getFiles(this.dirPath)
  }

  onNewFile(callback: (filePath: string) => void) {
    this.newFileCallback = callback
  }

  onDeleteFile(callback: (filePath: string) => void) {
    this.deleteFileCallback = callback
  }
}
