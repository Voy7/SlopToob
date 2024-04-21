export enum AuthRole {
  Normal,
  Admin
}

export enum SocketEvent {
  JoinStream = 'join-stream',
  ChangeUsername = 'change-username',
  ViewersList = 'viewers-list',
  SendChatMessage = 'send-chat-message',
  NewChatMessage = 'new-chat-message',
  StreamInfo = 'stream-info',

  // Admin event
  AdminRequestAllData = 'admin-request-all-data',
  AdminRequestFileTree = 'admin-request-file-tree',
  AdminRequestPlaylists = 'admin-request-playlists',
  AdminAddPlaylist = 'admin-add-playlist',
  AdminDeletePlaylist = 'admin-delete-playlist',
  AdminEditPlaylistName = 'admin-edit-playlist-name',
  AdminEditPlaylistVideos = 'admin-edit-playlist-videos',
  AdminSetActivePlaylist = 'admin-set-active-playlist',
  AdminUploadBumper = 'admin-upload-bumper',
  AdminDeleteBumper = 'admin-delete-bumper',
  AdminBumpersList = 'admin-bumpers-list',
  AdminQueueList = 'admin-queue-list',
  AdminTranscodeQueueList = 'admin-transcode-queue-list',
  AdminPauseStream = 'admin-pause-stream',
  AdminUnpauseStream = 'admin-unpause-stream',
  AdminSkipVideo = 'admin-skip-video',
  SettingActivePlaylist = 'admin-active-playlist',
  SettingAllowVoteSkip = 'admin-allow-vote-skip',
  SettingVoteSkipPercentage = 'admin-vote-skip-percentage',
  SettingBumperIntervalMinutes = 'admin-bumper-interval-minutes',
  SettingTargetQueueSize = 'admin-target-queue-size',
  SettingCacheVideos = 'admin-cache-videos',
  SettingCacheBumpers = 'admin-cache-bumpers',
  SettingFinishTranscode = 'admin-finish-transcode',
}

export enum ServerEvent {
  ChangeUsername,
  SendChatMessage,
}

export enum StreamState {
  Playing,
  Paused,
  Loading,
  Error
}

export enum VideoState {
  NotReady,
  Preparing,
  Ready,
  Playing,
  Paused,
  Finished,
  Errored
}

export enum JobState {
  Initializing,
  Idle,
  AwaitingTranscode,
  Transcoding,
  CleaningUp,
  Finished,
  Errored
}