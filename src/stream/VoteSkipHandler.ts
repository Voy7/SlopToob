import Logger from '@/server/Logger'
import Settings from '@/stream/Settings'
import Player from '@/stream/Player'
import SocketUtils from '@/lib/SocketUtils'
import Chat from '@/stream/Chat'
import { socketClients } from '@/server/socketClients'
import { Msg, VideoState } from '@/lib/enums'

export default new (class VoteSkipHandler {
  private _isAllowed: boolean = false
  private voterIDs: string[] = []
  private persistVoterIDs: string[] = []
  private allowedInTimeout: NodeJS.Timeout | null = null
  private allowedInDate: Date | null = null

  get isAllowed(): boolean {
    if (Player.playing?.isBumper && !Settings.canVoteSkipIfBumper) return false
    if (Player.playing?.state === VideoState.Paused && !Settings.canVoteSkipIfPaused) return false
    return this._isAllowed
  }

  enable() {
    Logger.debug('[VoteSkipHandler] enabled', this._isAllowed, this.allowedInTimeout)
    if (this._isAllowed || this.allowedInTimeout) return
    this.allowedInDate = new Date()
    this.allowedInTimeout = setTimeout(() => {
      this._isAllowed = true
      this.allowedInDate = null
      Player.broadcastStreamInfo()
    }, Settings.voteSkipDelaySeconds * 1000)
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
      message: `Vote skip passed! Skipping video... (${this.currentCount}/${socketClients.length})`
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
})()
