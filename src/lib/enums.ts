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
}

export enum ServerEvent {
  ChangeUsername,
  SendChatMessage,
}

export enum PlayerState {
  Playing,
  // Paused,
  Loading,
  Error
}