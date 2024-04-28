import type { ListOption } from '@/typings/types'

type Setting = {
  default: string | number | boolean,
  onChange?: (value: any) => void,
  clientValue?: () => any
}

// List of all settings, with their default values and optional hooks
// NOTE: Because of how Settings is initialized, most top-level imports are not allowed.
// Instead, use dynamic imports (except importing types is fine)
export const settingsList = {
  // Current active playlist, client uses the setting as a ListOption
  activePlaylistID: {
    default: 'None',
    clientValue: async (): Promise<ListOption> => {
      const { default: Player } = await import('@/stream/Player')
      return Player.listOptionPlaylists
    },
    onChange: async (value: string) => {
      const { default: Player } = await import('@/stream/Player')
      Player.setActivePlaylistID(value)
    },
  },

  // Enable vote skipping & percentage of votes needed to skip
  allowVoteSkip: { default: true },
  voteSkipPercentage: { default: 0.5 },
  voteSkipDelaySeconds: { default: 10 },

  // Minimum time between bumpers in minutes
  bumpersEnabled: { default: true },
  bumperIntervalMinutes: { default: 30 },

  // Minimum number of videos to keep in the queue, not including 'manually' added videos
  targetQueueSize: {
    default: 3,
    onChange: (value: number) => {
      //
    }
  },

  // Delete transcoded files after they are played or not
  cacheVideos: { default: true },
  cacheBumpers: { default: true },

  // How long to show video player errors for in seconds
  errorDisplaySeconds: { default: 5 },

  // Nickname related settings
  nicknameOnlyAlphanumeric: { default: true },
  nicknameMinLength: { default: 3 },
  nicknameMaxLength: { default: 20 },

  // Chat related settings
  chatMaxLength: { default: 120 },

  // ...
} satisfies Record<string, Setting>