import fs from 'fs/promises'
import path from 'path'
import { socketClients } from '@/server/socketClients'
import { ChatType, SocketEvent } from '@/lib/enums'
import { getClientBumpers } from '@/stream/bumpers'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import isNicknameValid from '@/lib/isNicknameValid'
import Env from '@/EnvVariables'
import Logger from '@/lib/Logger'
import Player from '@/stream/Player'
import TranscoderQueue from '@/stream/TranscoderQueue'
import SocketUtils from '@/lib/SocketUtils'
import type { Socket } from 'socket.io'
import type { JoinStreamPayload, SocketClient, Viewer, EditPlaylistNamePayload, EditPlaylistVideosPayload, ChatMessage } from '@/typings/socket'
import Settings from '@/stream/Settings'
// import Settings from '@/stream/Settings'
import FileTreeHandler from '@/stream/FileTreeHandler'
import VoteSkipHandler from '@/stream/VoteSkipHandler'

type EventOptions = {
  allowUnauthenticated?: boolean, // Allow unauthenticated users to run this event (default: false)
  adminOnly?: boolean, // Only allow admin users to run this event (default: false)
  run: (socket: Socket, payload: any) => void
}

export const socketEvents: Record<string, EventOptions> = {
  // If client disconnects, remove them from the viewers list and broadcast new list
  'disconnect': { run: (socket) => {
    const existingClient = socketClients.find(c => c.socket === socket)
    if (!existingClient) return
    socketClients.splice(socketClients.indexOf(existingClient), 1)

    VoteSkipHandler.removeVote(socket.id)
    VoteSkipHandler.resyncChanges()
    SocketUtils.broadcastViewersList()

    const { sendLeftStream } = Settings.getSettings()
    if (sendLeftStream) {
      const chatMessage: ChatMessage = {
        type: ChatType.Left,
        message: `${existingClient.username} left the stream.`
      }
      SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)
    }
  }},

  // Message sent from client on first connection, adds them to the viewers list
  [SocketEvent.JoinStream]: { allowUnauthenticated: true, run: (socket, payload: JoinStreamPayload) => {
    const existingClient = socketClients.find(c => c.socket === socket)
    if (existingClient) return

    const authRole = authRoleFromPassword(payload.password)
    if (authRole === null) return

    socketClients.push({
      socket: socket,
      secret: payload.secret,
      username: isNicknameValid(payload.username) === true ? payload.username : 'Anonymous',
      role: authRole
    })
    
    VoteSkipHandler.resyncChanges()
    SocketUtils.broadcastViewersList()

    socket.emit(SocketEvent.StreamInfo, Player.clientStreamInfo)
    socket.emit(SocketEvent.JoinStream, true)

    const { sendJoinedStream } = Settings.getSettings()
    if (sendJoinedStream) {
      const chatMessage: ChatMessage = {
        type: ChatType.Joined,
        message: `${payload.username} joined the stream.`
      }
      SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)
    }
  }},

  // Client changed their nickname
  // Respond true if successful, string if error
  [SocketEvent.ChangeNickname]: { run: (socket, newName: unknown) => {
    try {
      if (typeof newName !== 'string') throw new Error('Invalid payload.')

      const isValid = isNicknameValid(newName)
      if (typeof isValid === 'string') throw new Error(isValid)

      const client = socketClients.find(c => c.socket === socket)
      if (!client) throw new Error('Socket not found.') // Should never happen

      const oldName = client.username
      client.username = newName

      socket.emit(SocketEvent.ChangeNickname, true)
      SocketUtils.broadcastViewersList()

      const { sendChangedNickname } = Settings.getSettings()
      if (sendChangedNickname) {
        const chatMessage: ChatMessage = {
          type: ChatType.NicknameChange,
          message: `${oldName} changed their nickname to: ${newName}`
        }
        SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)
      }
    }

    catch (error: any) {
      socket.emit(SocketEvent.ChangeNickname, error.message)
    }
  }},

  // Client sent a chat message, respond with string if error
  [SocketEvent.SendChatMessage]: { run: (socket, message: unknown) => {
    try {
      if (typeof message !== 'string') throw new Error('Invalid payload.')

      const { chatMaxLength } = Settings.getSettings()
      if (message.length === 0) throw new Error('Message cannot be empty.')
      if (message.length > chatMaxLength) throw new Error(`Max message length is ${chatMaxLength} characters.`)

      const client = socketClients.find(c => c.socket === socket)
      if (!client) throw new Error('Socket not found.') // Should never happen

      const chatMessage: ChatMessage = {
        type: ChatType.UserChat,
        username: client.username,
        role: client.role,
        image: `/api/avatar/${client.socket.id}`, // Not sure if socket.id in sensitive, might need to change
        message: message
      }
      SocketUtils.broadcast(SocketEvent.NewChatMessage, chatMessage)
    }
    catch (error: any) {
      socket.emit(SocketEvent.SendChatMessage, error.message)
    }
  }},

  // User votes to skip current video
  [SocketEvent.VoteSkipAdd]: { run: (socket) => {
    VoteSkipHandler.addVote(socket.id)
    socket.emit(SocketEvent.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
  }},

  // User removes their vote to skip current video
  [SocketEvent.VoteSkipRemove]: { run: (socket) => {
    VoteSkipHandler.removeVote(socket.id)
    socket.emit(SocketEvent.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
  }},

  // Admin first admin panel load, send all needed data
  [SocketEvent.AdminRequestAllData]: { adminOnly: true, run: (socket) => {
    const playlists = Player.clientPlaylists
    const bumpers = getClientBumpers()

    socket.emit(SocketEvent.AdminRequestFileTree, FileTreeHandler.tree)
    socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
    socket.emit(SocketEvent.AdminBumpersList, bumpers)
    socket.emit(SocketEvent.AdminQueueList, Player.queue.map(video => video.clientVideo))
    socket.emit(SocketEvent.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
  }},

  // Admin request for the file tree
  [SocketEvent.AdminRequestFileTree]: { adminOnly: true, run: (socket) => {
    socket.emit(SocketEvent.AdminRequestFileTree, FileTreeHandler.tree)
  }},

  // Admin request for the playlists
  // [SocketEvent.AdminRequestPlaylists]: { adminOnly: true, run: async (socket) => {
  //   const playlists = Player.clientPlaylists
  //   socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
  // }},

  // Admin adds a new playlist
  [SocketEvent.AdminAddPlaylist]: { adminOnly: true, run: async (socket, newPlaylistName: string) => {
    const newPlaylistID = await Player.addPlaylist(newPlaylistName)
    socket.emit(SocketEvent.AdminAddPlaylist, newPlaylistID)
  }},

  // Admin deletes a playlist
  [SocketEvent.AdminDeletePlaylist]: { adminOnly: true, run: (socket, playlistID: string) => {
    Player.deletePlaylist(playlistID)
  }},

  // Admin edits a playlist name
  [SocketEvent.AdminEditPlaylistName]: { adminOnly: true, run: async (socket, payload: EditPlaylistNamePayload) => {
    const errorMsg = await Player.editPlaylistName(payload.playlistID, payload.newName)
    if (errorMsg) socket.emit(SocketEvent.AdminEditPlaylistName, errorMsg)
  }},

  // Admin edits a playlist's videos
  [SocketEvent.AdminEditPlaylistVideos]: { adminOnly: true, run: async (socket, payload: EditPlaylistVideosPayload) => {
    await Player.setPlaylistVideos(payload.playlistID, payload.newVideoPaths)
  }},

  // Admin uploads a bumper
  // Respond true if successful, string if error
  [SocketEvent.AdminUploadBumper]: { adminOnly: true, run: async (socket, payload: unknown) => {
    try {
      if (!payload || typeof payload !== 'object') throw new Error('Invalid payload.')
      if (!('name' in payload) || typeof payload.name !== 'string') throw new Error('Invalid payload.')
      if (!('videoFile' in payload) || typeof payload.videoFile !== 'string') throw new Error('No video selected.')
      if (payload.name.length <= 0) throw new Error('Bumper title cannot be empty.')

      const bumperExt = payload.videoFile.split(';base64,')[0].split('/')[1]
      const bumperName = `${payload.name}.${bumperExt}`
      const bumperPath = path.join(Env.BUMPERS_PATH, bumperName)
      const bumperExists = await fs.access(bumperPath).then(() => true).catch(() => false)
      if (bumperExists) throw new Error('Bumper with that name already exists.')
  
      const base64 = payload.videoFile.split(';base64,').pop()
      if (!base64) throw new Error('Invalid base64 data.')
      await fs.writeFile(bumperPath, base64, { encoding: 'base64' })
      socket.emit(SocketEvent.AdminUploadBumper, true)
    }
    catch (error: any) { socket.emit(SocketEvent.AdminUploadBumper, error.message) }
  }},

  // Admin deletes a bumper
  // Respond true if successful, string if error
  [SocketEvent.AdminDeleteBumper]: { adminOnly: true, run: async (socket, filePath: string) => {
    try {
      if (!filePath.startsWith(Env.BUMPERS_PATH)) throw new Error('File is not in bumpers directory.')
      await fs.rm(filePath)
      Logger.debug(`Admin requested deleted bumper: ${filePath}`)
      socket.emit(SocketEvent.AdminDeleteBumper, true)
    }
    catch (error: any) { socket.emit(SocketEvent.AdminDeleteBumper, error.message) }
  }},

  // Admin pauses the stream
  [SocketEvent.AdminPauseStream]: { adminOnly: true, run: () => {
    Player.pause()
  }},

  // Admin unpauses the stream
  [SocketEvent.AdminUnpauseStream]: { adminOnly: true, run: () => {
    Player.unpause()
  }},

  // Admin skips the current video
  [SocketEvent.AdminSkipVideo]: { adminOnly: true, run: () => {
    Player.skip()
  }},
}