import generateSecret from '@/lib/generateSecret'
import Logger from '@/server/Logger'
import Settings from '@/server/Settings'
import Player from '@/server/stream/Player'
import Chat from '@/server/stream/Chat'
import { socketClients } from '@/server/socket/socketClients'
import { VideoState } from '@/lib/enums'
import type { VoteSkipOptions } from '@/typings/socket'

// Main vote skip handler, singleton
class VoteSkipHandler {
  private _isAllowed: boolean = false
  private sessionID?: string
  private voterIDs: string[] = []
  private persistVoterIDs: string[] = []
  private allowedInTimeout?: NodeJS.Timeout
  private allowedInDate?: Date

  get isAllowed(): boolean {
    if (Player.playing?.isBumper && !Settings.canVoteSkipIfBumper) return false
    if (Player.playing?.state === VideoState.Paused && !Settings.canVoteSkipIfPaused) return false
    return this._isAllowed
  }

  enable() {
    if (this._isAllowed || this.allowedInTimeout) return
    this.sessionID = generateSecret()
    this.allowedInDate = new Date()
    this.allowedInTimeout = setTimeout(() => {
      this._isAllowed = true
      delete this.allowedInDate
      Player.broadcastStreamInfo()
    }, Settings.voteSkipDelaySeconds * 1000)
  }

  disable() {
    clearTimeout(this.allowedInTimeout)
    delete this.allowedInTimeout
    delete this.sessionID
    delete this.allowedInDate
    this._isAllowed = false
    this.voterIDs = []
    this.persistVoterIDs = []
  }

  addVote(socketID: string) {
    if (this.voterIDs.includes(socketID)) return
    this.voterIDs.push(socketID)

    if (!this.persistVoterIDs.includes(socketID)) {
      this.persistVoterIDs.push(socketID)
      const client = socketClients.find((client) => client.socket.id === socketID)
      if (!client || !Settings.sendVotedToSkip) return
      Chat.send({
        type: Chat.Type.VotedToSkip,
        message: `${client.username} voted to skip the video.`
      })
    }

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

  get currentCount(): number {
    return this.voterIDs.length
  }

  get requiredCount(): number {
    const required = Math.ceil((socketClients.length * Settings.voteSkipPercentage) / 100)
    return Math.max(1, required)
  }

  get allowedInSeconds(): number {
    if (Player.playing?.isBumper && !Settings.canVoteSkipIfBumper) return -1
    if (Player.playing?.state === VideoState.Paused && !Settings.canVoteSkipIfPaused) return -1

    if (!this.allowedInDate) return -1
    const passedSeconds = (Date.now() - this.allowedInDate.getTime()) / 1000
    return Math.max(0, Settings.voteSkipDelaySeconds - passedSeconds)
  }

  private processVotes() {
    Player.broadcastStreamInfo()
    if (this.currentCount < this.requiredCount) return
    this.passVote()
  }

  private passVote() {
    if (!Settings.sendVoteSkipPassed) return
    Chat.send({
      type: Chat.Type.VoteSkipPassed,
      message: `Vote skip passed! Skipping video...`
    })

    this.voterIDs = []
    this.persistVoterIDs = []
    Player.skip()
  }

  // Called when settings change, client join/leaves, etc
  resyncChanges() {
    Player.broadcastStreamInfo()
    if (this.currentCount < this.requiredCount) return
    this.passVote()
  }

  get voteSkipOptions(): VoteSkipOptions | null {
    if (!Settings.enableVoteSkip) return null
    if (!this.sessionID) return null
    return {
      sessionID: this.sessionID,
      isAllowed: this.isAllowed,
      allowedInSeconds: this.allowedInSeconds,
      currentCount: this.currentCount,
      requiredCount: this.requiredCount
    }
  }
}

export default new VoteSkipHandler()
