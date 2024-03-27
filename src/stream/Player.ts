import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import Env from '@/EnvVariables'
import Video from '@/stream/Video'
// import { broadcastStreamInfo } from '@/server/socket'
import { PlayerState } from '@/lib/enums'
import type { StreamInfo, StreamPlaying, StreamLoading, StreamError } from '@/typings/socket'
import { RichPlaylist, FileTree } from '@/typings/types'

// Main player (video) handler, singleton
export default new class Player {
  playing: Video | null = null
  queue: Video[] = []
  isPaused: boolean = false
  playlists: RichPlaylist[] = []

  constructor() {
    // Get all playlists on startup
    this.getPlaylists()
  }

  addVideo(video: Video) {
    this.queue.push(video)
    if (!this.playing) this.playNext()
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.playing = null
      return
    }

    const next = this.queue.shift()
    if (next) {
      this.playing = next
      const x = await this.playing.download()
      await this.playing.play()
    }
    // Start downloading next video in queue
    if (this.queue[0]) {
      this.queue[0].download()
    }
  }

  getStreamInfo(): StreamInfo {
    if (!this.playing || !this.playing.isReady) {
      return {
        state: PlayerState.Loading
      }
    }

    if (this.playing.error) {
      return {
        state: PlayerState.Error,
        error: this.playing.error
      }
    }

    return {
      state: PlayerState.Playing,
      id: this.playing.id,
      name: this.playing.path,
      path: `/stream-data/${this.playing.id}/video.m3u8`,
      currentSeconds: this.playing.currentSeconds,
      totalSeconds: this.playing.durationSeconds
    }
  }

  // Get all video files & directories in videos folder as a tree
  // Files are sorted by name, and are only video files
  // Tree can be infinite depth, get all files recursively
  async getVideosFileTree(): Promise<FileTree> {
    const rootPath = Env.VIDEOS_PATH
    
    const tree: FileTree = {
      isDirectory: true,
      name: 'Videos Root',
      path: rootPath,
      children: []
    }

    async function getChildren(path: string, parent: FileTree) {
      const files = await fs.readdir(path, { withFileTypes: true })
      for (const file of files) {
        const item: FileTree = {
          isDirectory: file.isDirectory(),
          name: file.name,
          path: `${path}/${file.name}`
        }

        if (item.isDirectory) {
          item.children = []
          await getChildren(item.path, item)
        }

        parent.children?.push(item)
      }

      parent.children?.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    }

    await getChildren(rootPath, tree)

    return tree
  }

  async getPlaylists() {
    const playlists = await prisma.playlist.findMany({
      include: { videos: true }
    })

    this.playlists = playlists
    return playlists
  }

  async addPlaylist(name: string) {
    const playlist = await prisma.playlist.create({
      data: { name }
    })

    await this.getPlaylists()
    return playlist
  }
}