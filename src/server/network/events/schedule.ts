import Events from '@/server/network/Events'
import Schedule from '@/server/stream/Schedule'
import { socketClients } from '@/server/network/socketClients'
import type { ScheduleEntryOptions } from '@/typings/types'

// Admin syncs the scheduler
Events.add(Events.Msg.AdminScheduleSync, {
  adminOnly: true,
  run: (socket, skipCurrentVideo?: true) => {
    const client = socketClients.find((c) => c.socket === socket)
    Schedule.sync(client, skipCurrentVideo)
  }
})

// Admin adds a new schedule entry
Events.add(Events.Msg.AdminScheduleAddEntry, {
  adminOnly: true,
  run: async (socket, options: ScheduleEntryOptions) => {
    await Schedule.addEntry(options)
  }
})

// Admin deletes a schedule entry
Events.add(Events.Msg.AdminScheduleDeleteEntry, {
  adminOnly: true,
  run: async (socket, entryID: number) => {
    await Schedule.removeEntry(entryID)
  }
})

// Admin updates a schedule entry
Events.add(Events.Msg.AdminScheduleUpdateEntry, {
  adminOnly: true,
  run: async (socket, payload: { entryID: number; options: ScheduleEntryOptions }) => {
    await Schedule.updateEntry(payload.entryID, payload.options)
  }
})
