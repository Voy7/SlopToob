import Video from '@/stream/Video'
// import { broadcastStreamInfo } from '@/server/socket'
import { PlayerState } from '@/lib/enums'
import type { StreamInfo, StreamPlaying, StreamLoading, StreamError } from '@/typings/socket'

// Main player (video) handler, singleton
export default new class Player {
  playing: Video | null = null
  queue: Video[] = []
  isPaused: boolean = false

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
}