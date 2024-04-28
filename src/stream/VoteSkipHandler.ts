import Settings from '@/stream/Settings'
import Player from '@/stream/Player'
import SocketUtils from '@/lib/SocketUtils'
import { socketClients } from '@/server/socketClients'
import { SocketEvent } from '@/lib/enums'

export default new class VoteSkipHandler {
  isAllowed: boolean = false
  private voterIDs: string[] = []
  private allowedInTimeout: NodeJS.Timeout | undefined = undefined
  private allowedInDate: Date | null = null

  enable() {
    if (this.isAllowed || this.allowedInTimeout) return
    const { voteSkipDelaySeconds } = Settings.getSettings()
    this.allowedInDate = new Date()
    this.allowedInTimeout = setTimeout(() => {
      this.isAllowed = true
      this.allowedInDate = null
      SocketUtils.broadcast(SocketEvent.StreamInfo, Player.clientStreamInfo)
    }, voteSkipDelaySeconds * 1000)
  }

  disable() {
    clearTimeout(this.allowedInTimeout)
    this.allowedInDate = null
    this.isAllowed = false
    this.voterIDs = []
  }

  addVote(socketID: string) {
    if (this.voterIDs.includes(socketID)) return
    this.voterIDs.push(socketID)
    this.processVotes()
  }

  removeVote(socketID: string) {
    const index = this.voterIDs.indexOf(socketID)
    if (index === -1) return
    this.voterIDs.splice(index, 1)
    this.processVotes()
  }

  hasVoted(socketID: string): boolean {
    return this.voterIDs.includes(socketID)
  }

  get currentCount(): number { return this.voterIDs.length }

  get requiredCount(): number {
    const { voteSkipPercentage } = Settings.getSettings()
    const required = Math.ceil(socketClients.length * (voteSkipPercentage / 100))
    return Math.max(1, required)
  }

  get allowedInSeconds(): number {
    if (!this.allowedInDate) return -1
    const { voteSkipDelaySeconds } = Settings.getSettings()
    const passedSeconds = (Date.now() - this.allowedInDate.getTime()) / 1000
    return Math.max(0, voteSkipDelaySeconds - passedSeconds)
  }

  private processVotes() {
    SocketUtils.broadcast(SocketEvent.StreamInfo, Player.clientStreamInfo)
    if (this.currentCount < this.requiredCount) return
    this.voterIDs = []
    Player.skip()
  }
}