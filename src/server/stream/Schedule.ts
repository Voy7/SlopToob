import prisma from '@/server/lib/prisma'
import Checklist from '@/server/core/Checklist'
import Settings from '@/server/core/Settings'
import Player from '@/server/stream/Player'
import Chat from '@/server/stream/Chat'
import Thumbnails from '@/server/stream/Thumbnails'
import SocketUtils from '@/server/network/SocketUtils'
import { Msg } from '@/shared/enums'
import { daysOfWeek } from '@/shared/data/daysOfWeek'
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
    this.sort()
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
    Settings.set('weekyScheduleInSync', true)
    this.updateCheck()

    if (!executedBy || !Settings.sendAdminSyncedSchedule) return
    const playlist = Player.playlists.find((p) => p.id === this.getActiveEntry()?.playlistID)
    if (!playlist) return
    Chat.send({
      type: Chat.Type.AdminSyncedSchedule,
      message: `${executedBy.username} synced the playlist scheduler to: ${playlist.name}`
    })
  }

  unsyncCheck(newPlaylistID?: string) {
    if (!Settings.enableWeeklySchedule || !Settings.weekyScheduleInSync) return
    const activeEntry = this.getActiveEntry()
    if (!activeEntry || newPlaylistID === activeEntry.playlistID) return
    this.unsync()
  }

  private unsync() {
    if (this.syncTimeout) clearTimeout(this.syncTimeout)
    Settings.set('weekyScheduleInSync', false)
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
      const secondsUntil = this.getSecondsUntil(new Date(), nextEntry) || 1
      this.syncTimeout = setTimeout(() => this.updateCheck(), secondsUntil * 1000)
    }

    if (Player.activePlaylist?.id === activeEntry.playlistID) {
      SocketUtils.broadcastAdmin(Msg.AdminSchedule, this.clientSchedule)
      SocketUtils.broadcast(Msg.ScheduleDisplay, this.clientScheduleDisplay)
      return
    }

    const playlist = Player.playlists.find((p) => p.id === activeEntry.playlistID)
    if (!playlist) return this.unsync()
    // Player.setActivePlaylistID(activeEntry.playlistID, undefined, true)
    Settings.set('activePlaylistID', activeEntry.playlistID)
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

    const currentSecondsIn =
      day * 86400 + hours * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()

    const entrySecondsIn = entry.dayOfWeek * 86400 + entry.secondsIn

    return entrySecondsIn > currentSecondsIn
      ? entrySecondsIn - currentSecondsIn
      : 604800 - currentSecondsIn + entrySecondsIn
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
    if (!Settings.showWeeklySchedule) return null
    if (!Settings.showWeeklyScheduleIfUnsynced && !Settings.weekyScheduleInSync) return null
    return {
      inSync: Settings.weekyScheduleInSync,
      activeEntryIndex:
        this.entries.findIndex((e) => e.playlistID === Player.activePlaylist?.id) || null,
      entries: this.entries.map((entry) => {
        const playlist = Player.playlists.find((p) => p.id === entry.playlistID)
        const realHour = Math.floor(entry.secondsIn / 3600)
        const obj: ClientScheduleDisplay['entries'][0] = {
          day: daysOfWeek[entry.dayOfWeek] || 'Invalid Day',
          playlist: playlist ? playlist.name : '(Deleted Playlist)',
          thumbnailURL: Thumbnails.getPlaylistURL(entry.playlistID)
        }
        if (Settings.showWeeklyScheduleTimemarks) {
          const minute = Math.floor((entry.secondsIn % 3600) / 60)
            .toString()
            .padStart(2, '0')
          const ampm = realHour >= 12 ? 'PM' : 'AM'
          const hour = realHour > 12 ? realHour - 12 : realHour
          obj.timemark = `${hour}:${minute}${ampm}`
        }
        return obj
      })
    }
  }
}

export default new Schedule()
