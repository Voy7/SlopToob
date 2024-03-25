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