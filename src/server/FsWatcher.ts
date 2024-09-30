import fs from 'fs'
import Logger from '@/server/Logger'

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

    fs.watch(this.dirPath, { recursive: true }, async (event, filename) => {
      // console.log(filename, event)
      if (event !== 'rename') return
      if (!filename) return

      const fullPath = `${this.dirPath}/${filename}`.replace(/\\/g, '/')

      if (fs.existsSync(fullPath)) {
        const isDir = fs.statSync(fullPath).isDirectory()
        if (isDir) {
          // Crawling entire directory and emitting new file events
          try {
            const files = await this.crawlDirectory(fullPath)
            files.forEach((file) => this.newFileCallback?.(file))
          } catch (error) {
            Logger.error('[FsWatcher] Error crawling directory:', error)
          }
          return
        }
        this.newFileCallback?.(fullPath)
        return
      }

      // if (isDir) {
      //   this.deleteDirectoryCallback?.(fullPath)
      //   return
      // }
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

  // Crawl entire given directory and return all files
  private async crawlDirectory(dir: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const results: string[] = []
      const walk = (dirPath: string, done: (error?: Error) => void) => {
        fs.readdir(dirPath, { withFileTypes: true }, (error, list) => {
          if (error) return done(error)
          let pending = list.length
          if (!pending) return done()
          list.forEach((file) => {
            const filePath = `${dirPath}/${file.name}`
            if (file.isDirectory()) {
              return walk(filePath, (error) => {
                if (error) return done(error)
                if (!--pending) done()
              })
            }
            results.push(filePath)
            if (!--pending) done()
          })
        })
      }

      walk(dir, (error) => {
        if (error) reject(error)
        else resolve(results)
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
