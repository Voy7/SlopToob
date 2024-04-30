import Logger from '@/lib/Logger'
import Settings from '@/stream/Settings'
import Player from '@/stream/Player'
import SocketUtils from '@/lib/SocketUtils'
import { socketClients } from '@/server/socketClients'
import { ChatType, SocketEvent, VideoState } from '@/lib/enums'
import { ChatMessage } from '@/typings/socket'

export default new class VoteSkipHandler {
  private _isAllowed: boolean = false
  private voterIDs: string[] = []
  private allowedInTimeout: NodeJS.Timeout | null = null
  private allowedInDate: Date | null = null

  get isAllowed(): boolean {
    const { canVoteSkipIfBumper, canVoteSkipIfPaused } = Settings.getSettings()
    if (Player.playing?.isBumper && !canVoteSkipIfBumper) return false
    if (Player.playing?.state === VideoState.Paused && !canVoteSkipIfPaused) return false
    return this._isAllowed
  }

  enable() {
    Logger.debug('[VoteSkipHandler] enabled', this._isAllowed, this.allowedInTimeout)
    if (this._isAllowed || this.allowedInTimeout) return
    const { voteSkipDelaySeconds } = Settings.getSettings()
    this.allowedInDate = new Date()
    this.allowedInTimeout = setTimeout(() => {
      this._isAllowed = true
      this.allowedInDate = null
      SocketUtils.broadcast(SocketEvent.StreamInfo, Player.clientStreamInfo)
    }, voteSkipDelaySeconds * 1000)
  }

  disable() {
    Logger.debug('[VoteSkipHandler] disabled')
    if (this.allowedInTimeout) {
      clearTimeout(this.allowedInTimeout)
      this.allowedInTimeout = null
    }
    this.allowedInDate = null
    this._isAllowed = false
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
    const required = Math.ceil(socketClients.length * voteSkipPercentage / 100)
    console.log('required', required)
    return Math.max(1, required)
  }

  get allowedInSeconds(): number {
    const { canVoteSkipIfBumper, canVoteSkipIfPaused } = Settings.getSettings()
    if (Player.playing?.isBumper && !canVoteSkipIfBumper) return -1
    if (Player.playing?.state === VideoState.Paused && !canVoteSkipIfPaused) return -1

    if (!this.allowedInDate) return -1
    const { voteSkipDelaySeconds } = Settings.getSettings()
    const passedSeconds = (Date.now() - this.allowedInDate.getTime()) / 1000
    return Math.max(0, voteSkipDelaySeconds - passedSeconds)
  }

  private processVotes() {
    SocketUtils.broadcast(SocketEvent.StreamInfo, Player.clientStreamInfo)
    if (this.currentCount < this.requiredCount) return
    this.passVote()
  }

  private passVote() {
    const { sendVoteSkipPassed } = Settings.getSettings()
    if (sendVoteSkipPassed) {
      const chatMessage: ChatMessage = {
        type: ChatType.VoteSkipPassed,
        message: `Vote skip passed! Skipping video... (${this.currentCount}/${this.requiredCount})`,
      }
      SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)
    }

    this.voterIDs = []
    Player.skip()

  }

  // Called when settings change, client join/leaves, etc
  resyncChanges() {
    SocketUtils.broadcast(SocketEvent.StreamInfo, Player.clientStreamInfo)
    if (this.currentCount < this.requiredCount) return
    this.passVote()
  }
}