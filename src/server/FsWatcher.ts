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
      if (event !== 'rename') return
      if (!filename) return

      const fullPath = `${this.dirPath}/${filename}`.replace(/\\/g, '/')
      if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isDirectory()) return
        this.newFileCallback?.(fullPath)
        return
      }
      this.deleteFileCallback?.(fullPath)
    })
  }

  // Crawl entire tree and emit new file event for each file
  async emitAllCurrentFiles() {
    return new Promise<void>((resolve, reject) => {
      const walk = (dir: string, done: (error?: Error) => void) => {
        // const results: string[] = []
        fs.readdir(dir, { withFileTypes: true }, (err, list) => {
          if (err) return done(err)
          let pending = list.length
          if (!pending) return done()
          list.forEach((file) => {
            const filePath = `${dir}/${file.name}`
            if (file.isDirectory()) {
              walk(filePath, (res) => {
                if (!--pending) done()
              })
            } else {
              this.newFileCallback?.(filePath)
              if (!--pending) done()
            }
          })
        })
      }

      walk(this.dirPath, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  onNewFile(callback: (filePath: string) => void) {
    this.newFileCallback = callback
  }

  onDeleteFile(callback: (filePath: string) => void) {
    this.deleteFileCallback = callback
  }
}
