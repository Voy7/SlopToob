export const enum AuthRole {
  Normal,
  Admin
}

export const enum Msg {
  // Socket.io predefined events
  Connect = 'connect',
  Disconnect = 'disconnect',

  // Normal client events
  Authenticate = 'authenticate',
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
  AdminStreamInfo = 'admin-stream-info',
  AdminRequestAllData = 'admin-request-all-data',
  AdminFileTree = 'admin-file-tree',
  AdminPlaylists = 'admin-playlists',
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
  AdminHistoryStatus = 'admin-history-status',
  AdminDeleteHistory = 'admin-delete-history',
  AdminVideosCacheStatus = 'admin-videos-cache-status',
  AdminBumpersCacheStatus = 'admin-bumpers-cache-status',
  AdminPauseStream = 'admin-pause-stream',
  AdminUnpauseStream = 'admin-unpause-stream',
  AdminSkipVideo = 'admin-skip-video',
  AdminSeekTo = 'admin-seek-to',
  AdminTerminateJob = 'admin-terminate-job',
  AdminRemoveQueueVideo = 'admin-remove-queue-item',
  AdminDebugJob = 'admin-debug-job',
  AdminDebugVideo = 'admin-debug-video',
  AdminSendAllLogs = 'admin-send-all-logs',
  AdminNewLog = 'admin-new-log'
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
  Seeking,
  Finished,
  Errored
}

export const enum JobState {
  Initializing,
  Idle,
  AwaitingTranscode,
  Transcoding,
  Finished,
  CleaningUp,
  Errored
}

export enum ChatType {
  UserChat,
  Error,
  Joined,
  Left,
  NicknameChange,
  VotedToSkip,
  VoteSkipPassed,
  AdminPause,
  AdminUnpause,
  AdminSkip,
  AdminChangePlaylist
}
