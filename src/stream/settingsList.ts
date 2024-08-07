import type { ListOption } from '@/typings/types'
import type { SocketClient } from '@/typings/socket'

// List of all settings, with their default values and optional hooks
// NOTE: Because of how Settings is initialized, most top-level imports are not allowed.
// Instead, use dynamic imports (except importing types is fine)

type Setting = {
  default: string | number | boolean
  onChange?: (value: any) => void
  clientValue?: () => any
}

export const settingsList = {
  // Current active playlist, client uses the setting as a ListOption
  activePlaylistID: {
    default: 'None',
    clientValue: async (): Promise<ListOption> => {
      const { default: Player } = await import('@/stream/Player')
      return Player.listOptionPlaylists
    },
    onChange: async (value: string, executedBy?: SocketClient) => {
      const { default: Player } = await import('@/stream/Player')
      Player.setActivePlaylistID(value, executedBy)
    }
  },

  streamTheme: {
    default: 'None',
    clientValue: async (): Promise<ListOption> => {
      const { default: Player } = await import('@/stream/Player')
      return Player.listOptionThemes
    },
    onChange: chatResync
  },

  // Is not a normal setting, just a persistant state for if the server restarts
  streamIsPaused: { default: false },

  // Enable vote skipping & percentage of votes needed to skip
  enableVoteSkip: { default: true, onChange: voteSkipResync },
  voteSkipPercentage: { default: 50, onChange: voteSkipResync },
  voteSkipDelaySeconds: { default: 10, onChange: voteSkipResync },
  canVoteSkipIfBumper: { default: false, onChange: voteSkipResync },
  canVoteSkipIfPaused: { default: false, onChange: voteSkipResync },

  // Minimum time between bumpers in minutes
  bumpersEnabled: { default: true },
  bumperIntervalMinutes: { default: 30 },

  // Minimum number of videos to keep in the queue, not including 'manually' added videos
  targetQueueSize: {
    default: 3,
    onChange: async (value: number) => {
      const { default: Player } = await import('@/stream/Player')
      Player.populateRandomToQueue()
    }
  },

  // Delete transcoded files after they are played or not
  cacheVideos: { default: true },
  cacheBumpers: { default: true },

  // Max transcoding jobs that can run at once
  maxTranscodingJobs: { default: 2 },

  // How long to show video player errors for in seconds
  errorDisplaySeconds: { default: 5 },

  // Nickname related settings
  nicknameOnlyAlphanumeric: { default: true },
  nicknameMinLength: { default: 3 },
  nicknameMaxLength: { default: 20 },

  // Chat related settings
  chatMaxLength: { default: 120 },

  // Chat elements
  showChatTimestamps: { default: true, onChange: chatResync },
  showChatIdenticons: { default: true, onChange: chatResync },

  // Chat event settings
  sendJoinedStream: { default: true },
  sendLeftStream: { default: true },
  sendChangedNickname: { default: true },
  sendVotedToSkip: { default: true },
  sendVoteSkipPassed: { default: true },
  sendAdminPause: { default: true },
  sendAdminUnpause: { default: true },
  sendAdminSkip: { default: true },
  sendAdminChangePlaylist: { default: true },

  // Pause stream when no one is watching
  pauseWhenInactive: { default: true },

  // If average video is 10~ min, smart-shuffle history is valid for roughly a week
  historyMaxItems: { default: 1000, onChange: historyResync },

  // Settings for stream history display
  historyDisplayEnabled: { default: true, onChange: historyResync },
  historyDisplayItems: { default: 5, onChange: historyResync },
  historyDisplayBumpers: { default: false, onChange: historyResync },

  // How long to extend the video duration by
  videoPaddingSeconds: { default: 1 },

  // Advanced name parsing for common torrent filename patterns
  torrentNameParsing: { default: false }
} satisfies Record<string, Setting>

async function voteSkipResync() {
  const { default: VoteSkipHandler } = await import('@/stream/VoteSkipHandler')
  VoteSkipHandler.resyncChanges()
}

async function chatResync() {
  const { default: Chat } = await import('@/stream/Chat')
  Chat.resyncChanges()
}

async function historyResync() {
  const { default: PlayHistory } = await import('@/stream/PlayHistory')
  PlayHistory.resyncChanges()
}
