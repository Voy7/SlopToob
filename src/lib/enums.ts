export const enum AuthRole {
  Normal,
  Admin
}

export const enum SocketEvent {
  JoinStream = 'join-stream',
  ChangeNickname = 'change-nickname',
  ViewersList = 'viewers-list',
  SendChatMessage = 'send-chat-message',
  NewChatMessage = 'new-chat-message',
  StreamInfo = 'stream-info',
  VoteSkipAdd = 'vote-skip-add',
  VoteSkipRemove = 'vote-skip-remove',
  VoteSkipStatus = 'vote-skip-status',

  // Admin events
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
}

export const enum StreamState {
  Playing,
  Paused,
  Loading,
  Error
}

export const enum VideoState {
  NotReady,
  Preparing,
  Ready,
  Playing,
  Paused,
  Finished,
  Errored
}

export const enum JobState {
  Initializing,
  Idle,
  AwaitingTranscode,
  Transcoding,
  CleaningUp,
  Finished,
  Errored
}