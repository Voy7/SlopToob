import prisma from '@/lib/prisma'
import Checklist from '@/server/Checklist'
import Settings from '@/server/Settings'
import Player from '@/server/stream/Player'
import Chat from '@/server/stream/Chat'
import SocketUtils from '../socket/SocketUtils'
import { Msg } from '@/lib/enums'
import type { WeeklySchedule as DBScheduleEntry } from '@prisma/client'
import type { ClientSchedule, ClientScheduleDisplay, SocketClient } from '@/typings/socket'
import type { ScheduleEntryOptions } from '@/typings/types'

// Weekly playlist schedule handler, singleton
class Schedule {
  private entries: DBScheduleEntry[] = []
  private syncTimeout?: NodeJS.Timeout

  async initialize() {
    Checklist.running('scheduleReady')
    this.entries = await prisma.weeklySchedule.findMany()
    this.updateCheck()
    Checklist.pass('scheduleReady', `Loaded ${this.entries.length} entries`)
  }

  // Add a new entry to the schedule
  async addEntry(options: ScheduleEntryOptions) {
    if (!options) return
    this.validateOptions(options)

    const entry = await prisma.weeklySchedule.create({
      data: {
        isEnabled: options.isEnabled,
        dayOfWeek: options.day,
        secondsIn: options.hours * 3600 + options.minutes * 60,
        playlistID: options.playlistID
      }
    })
    this.entries.push(entry)
    this.sort()
    this.updateCheck()
    SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
    SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
  }

  // Remove entry by ID
  async removeEntry(entryID: number) {
    const index = this.entries.findIndex((e) => e.id === entryID)
    if (index === -1) return
    this.entries.splice(index, 1)
    this.updateCheck()
    SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
    SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
    await prisma.weeklySchedule.delete({ where: { id: entryID } })
  }

  // Update entry by ID
  async updateEntry(entryID: number, options: ScheduleEntryOptions) {
    const entry = this.entries.find((e) => e.id === entryID)
    if (!entry) return

    if (!options) return
    this.validateOptions(options)

    entry.isEnabled = options.isEnabled
    entry.dayOfWeek = options.day
    entry.secondsIn = options.hours * 3600 + options.minutes * 60
    entry.playlistID = options.playlistID
    this.sort()
    this.updateCheck()
    SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
    SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)

    await prisma.weeklySchedule.update({
      where: { id: entryID },
      data: {
        isEnabled: options.isEnabled,
        dayOfWeek: options.day,
        secondsIn: options.hours * 3600 + options.minutes * 60,
        playlistID: options.playlistID
      }
    })
  }

  sync(executedBy?: SocketClient, skipCurrentVideo?: boolean) {
    Settings.setSetting('weekyScheduleInSync', true)
    this.updateCheck()

    if (!executedBy || !Settings.sendAdminSyncedSchedule) return
    const playlist = Player.playlists.find((p) => p.id === this.getActiveEntry()?.playlistID)
    if (!playlist) return
    Chat.send({
      type: Chat.Type.AdminSyncedSchedule,
      message: `${executedBy.username} synced the playlist scheduler to: ${playlist.name}`
    })
  }

  unsync() {
    Settings.setSetting('weekyScheduleInSync', false)
    SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
    SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
  }

  updateCheck() {
    if (this.syncTimeout) clearTimeout(this.syncTimeout)
    if (!Settings.enableWeeklySchedule || !Settings.weekyScheduleInSync) return this.unsync()

    const entries = this.getValidEntries()

    const activeEntry = this.getActiveEntry()
    if (!activeEntry) return this.unsync()

    const indexOfCurrent = entries.findIndex((e) => e.id === activeEntry.id)
    if (indexOfCurrent === -1) return this.unsync()

    const nextEntry =
      indexOfCurrent === entries.length - 1 ? entries[0] : entries[indexOfCurrent + 1]

    if (nextEntry) {
      const now = new Date()
      const day = now.getUTCDay()
      const seconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()

      let dayOffsetSeconds = 0
      if (nextEntry.dayOfWeek > day) dayOffsetSeconds = (nextEntry.dayOfWeek - day) * 86400
      else if (nextEntry.dayOfWeek < day) dayOffsetSeconds = (7 - day + nextEntry.dayOfWeek) * 86400

      let secondsUntil = nextEntry.secondsIn - seconds + dayOffsetSeconds
      if (secondsUntil < 1) secondsUntil = 1

      this.syncTimeout = setTimeout(() => this.updateCheck, secondsUntil * 1000)
    }

    if (Player.activePlaylist?.id === activeEntry.playlistID) {
      SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
      SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
      return
    }

    const playlist = Player.playlists.find((p) => p.id === activeEntry.playlistID)
    if (!playlist) return
    Player.setActivePlaylistID(activeEntry.playlistID, undefined, true)
    SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
    SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
  }

  // Get valid/useable entries
  private getValidEntries(): DBScheduleEntry[] {
    return this.entries.filter(
      (e) => e.isEnabled && Player.playlists.find((p) => p.id === e.playlistID)
    )
  }

  // Get the current entry that should be playing
  private getActiveEntry(): DBScheduleEntry | undefined {
    const entries = this.getValidEntries()

    if (entries.length === 0) return
    if (entries.length === 1) return entries[0]

    const now = new Date()
    let prevSecondsUntil: number | null = null
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const secondsUntil = this.getSecondsUntil(now, entry)
      console.log(entry.id, secondsUntil)
      if (prevSecondsUntil === null) {
        prevSecondsUntil = secondsUntil
        continue
      }
      if (prevSecondsUntil >= secondsUntil) return entries[i - 1]
    }
    return entries[entries.length - 1]
  }

  // Get how many seconds until entry should be played
  private getSecondsUntil(date: Date, entry: DBScheduleEntry): number {
    let day = date.getUTCDay()
    let hours = date.getUTCHours() + Settings.weeklyScheduleUTCOffset
    if (hours > 23) {
      hours -= 24
      day++
      if (day > 6) day = 0
    }
    if (hours < 0) {
      hours += 24
      day--
      if (day < 0) day = 6
    }

    let currentSecondsIn =
      day * 86400 + hours * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()

    // Calculate how many seconds into the week th entry is
    const entrySecondsIn = entry.dayOfWeek * 86400 + entry.secondsIn

    // const SECONDS_IN_A_WEEK = 604800
    return entrySecondsIn > currentSecondsIn
      ? entrySecondsIn - currentSecondsIn
      : 604800 - currentSecondsIn + entrySecondsIn

    // const day = date.getUTCDay()
    // const seconds = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()

    // let dayOffsetSeconds = 0
    // if (entry.dayOfWeek > day) dayOffsetSeconds = (entry.dayOfWeek - day) * 86400
    // else if (entry.dayOfWeek < day) dayOffsetSeconds = (7 - day + entry.dayOfWeek) * 86400

    // let secondsUntil = entry.secondsIn - seconds + dayOffsetSeconds
    // if (secondsUntil < 1) secondsUntil = 1
    // return secondsUntil
  }

  // Sort entries by day and time to be in order
  private sort() {
    this.entries.sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) return a.secondsIn - b.secondsIn
      return a.dayOfWeek - b.dayOfWeek
    })
  }

  // Make sure ScheduleEntryOptions are in correct parameters
  private validateOptions(options: ScheduleEntryOptions): ScheduleEntryOptions {
    if (!options) return options
    if (options.day < 0) options.day = 0
    if (options.day > 6) options.day = 6
    if (options.hours < 0) options.hours = 0
    if (options.hours > 23) options.hours = 23
    if (options.minutes < 0) options.minutes = 0
    if (options.minutes > 59) options.minutes = 59
    return options
  }

  get clientSchedule(): ClientSchedule {
    return {
      isEnabled: Settings.enableWeeklySchedule,
      isSynced: Settings.weekyScheduleInSync,
      canBeSynced: Settings.enableWeeklySchedule && this.getValidEntries().length > 0,
      activeEntryID: this.getActiveEntry()?.id || null,
      entries: this.entries.map((entry) => ({
        id: entry.id,
        isEnabled: entry.isEnabled,
        dayOfWeek: entry.dayOfWeek,
        hours: Math.floor(entry.secondsIn / 3600),
        minutes: Math.floor((entry.secondsIn % 3600) / 60),
        playlistID: entry.playlistID
      }))
    }
  }

  get clientScheduleDisplay(): ClientScheduleDisplay | null {
    if (!Settings.enableWeeklySchedule) return null
    return {
      inSync: Settings.weekyScheduleInSync,
      activeEntryIndex:
        this.entries.findIndex((e) => e.playlistID === Player.activePlaylist?.id) || null,
      entries: this.entries.map((entry) => {
        const playlist = Player.playlists.find((p) => p.id === entry.playlistID)
        return {
          name: playlist ? playlist.name : '(Deleted Playlist)',
          date: `${entry.dayOfWeek} ${entry.secondsIn}`
        }
      })
    }
  }
}

export default new Schedule()
