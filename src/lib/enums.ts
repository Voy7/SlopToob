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

  // Admin events
  AdminRequestFileTree = 'admin-request-file-tree',
  AdminRequestPlaylists = 'admin-request-playlists',
  AdminAddPlaylist = 'admin-add-playlist',
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