import fs from 'fs/promises'
import path from 'path'
import { clients } from '@/server/socket'
import { SocketEvent } from '@/lib/enums'
import { getClientBumpers } from '@/stream/bumpers'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import Env from '@/EnvVariables'
import Player from '@/stream/Player'
import Logger from '@/lib/Logger'
import SocketUtils from '@/lib/SocketUtils'
import type { Socket } from 'socket.io'
import type { JoinStreamPayload, Client, Viewer, EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'
import TranscoderQueue from '@/stream/TranscoderQueue'
import Settings from '@/stream/Settings'

type EventOptions = {
  allowUnauthenticated?: boolean, // Allow unauthenticated users to run this event (default: false)
  adminOnly?: boolean, // Only allow admin users to run this event (default: false)
  run: (socket: Socket, payload: any) => void
}

export const socketEvents: Record<string, EventOptions> = {
  // If client disconnects, remove them from the viewers list and broadcast new list
  'disconnect': { run: (socket) => {
    const index = clients.findIndex(c => c.socket === socket)
    if (index !== -1) clients.splice(index, 1)
    SocketUtils.broadcastViewersList()
  }},

  // Message sent from client on first connection, adds them to the viewers list
  [SocketEvent.JoinStream]: { allowUnauthenticated: true, run: (socket, payload: JoinStreamPayload) => {
    const existingClient = clients.find(c => c.socket === socket)
    if (existingClient) return

    const authRole = authRoleFromPassword(payload.password)
    if (authRole === null) return

    clients.push({
      socket: socket,
      secret: payload.secret,
      username: payload.username,
      role: authRole
    })
    SocketUtils.broadcastViewersList()

    const streamInfo = Player.getStreamInfo()
    socket.emit(SocketEvent.StreamInfo, streamInfo)
    socket.emit(SocketEvent.JoinStream, true)
  }},

  // Client changed their username, update the viewers list
  [SocketEvent.ChangeUsername]: { run: (socket, newUsername: string) => {
    const client = clients.find(c => c.socket === socket)
    if (client) client.username = newUsername
    SocketUtils.broadcastViewersList()
  }},

  // Admin first admin panel load, send all needed data
  [SocketEvent.AdminRequestAllData]: { adminOnly: true, run: async (socket) => {
    const tree = await Player.getVideosFileTree()
    const playlists = Player.clientPlaylists
    const bumpers = getClientBumpers()

    socket.emit(SocketEvent.AdminRequestFileTree, tree)
    socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
    socket.emit(SocketEvent.AdminBumpersList, bumpers)
    SocketUtils.broadcastAdmin(SocketEvent.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    SocketUtils.broadcastStreamInfo()
  }},

  // Admin request for the file tree
  [SocketEvent.AdminRequestFileTree]: { adminOnly: true, run: async (socket) => {
    const tree = await Player.getVideosFileTree()
    socket.emit(SocketEvent.AdminRequestFileTree, tree)
  }},

  // Admin request for the playlists
  [SocketEvent.AdminRequestPlaylists]: { adminOnly: true, run: async (socket) => {
    const playlists = Player.clientPlaylists
    socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
  }},

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

  // Admin sets the active playlist
  // [SocketEvent.AdminSetActivePlaylist]: { adminOnly: true, run: async (socket, playlistID: string) => {
  //   const playlist = Player.playlists.find(p => p.id === playlistID) || null
  //   await Player.setActivePlaylist(playlist)
  // }},

  // Admin uploads a bumper
  [SocketEvent.AdminUploadBumper]: { adminOnly: true, run: async (socket, payload: any) => {
    // console.log('AdminUploadBumper:', payload)
    if (
      !payload || typeof payload !== 'object' ||
      !('name' in payload) || typeof payload.name !== 'string' ||
      !('videoFile' in payload) || typeof payload.videoFile !== 'string'
    ) {
      socket.emit(SocketEvent.AdminUploadBumper, 'Invalid payload.')
      return
    }

    const bumperName = payload.name
    const bumperPath = path.join(Env.BUMPERS_PATH, bumperName)
    const bumperExists = await fs.access(bumperPath).then(() => true).catch(() => false)
    if (bumperExists) {
      socket.emit(SocketEvent.AdminUploadBumper, 'Bumper already exists.')
      return
    }

    await fs.writeFile(bumperPath, payload.videoFile)
    SocketUtils.broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
  }},

  // Admin deletes a bumper
  [SocketEvent.AdminDeleteBumper]: { adminOnly: true, run: async (socket, filePath: string) => {
    try {
      if (!filePath.startsWith(Env.BUMPERS_PATH)) throw new Error('File is not in bumpers directory.')
      await fs.rm(filePath)
      Logger.debug(`Admin requested deleted bumper: ${filePath}`)
      socket.emit(SocketEvent.AdminDeleteBumper, { success: true })
      SocketUtils.broadcastAdmin(SocketEvent.AdminBumpersList, getClientBumpers())
    }
    catch (error: any) { socket.emit(SocketEvent.AdminDeleteBumper, { error: error.message }) }
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
    Player.skipVideo()
  }},

  // Admin requests the queue list
  // [SocketEvent.AdminQueueList]: { adminOnly: true, run: () => {
  //   broadcastAdmin(SocketEvent.AdminQueueList, Player.getQueue())
  // }},

  [SocketEvent.AdminActivePlaylist]: { adminOnly: true, run: (socket, value?: string) => {
    if (value === undefined) {
      socket.emit(SocketEvent.AdminActivePlaylist, Player.listOptionPlaylists)
      return
    }
    const playlist = Player.playlists.find(p => p.id === value) || null
    Player.setActivePlaylist(playlist)
  }},
  
  [SocketEvent.AdminCacheVideos]: { adminOnly: true, run: (socket, value?: boolean) => {
    if (value === undefined) return socket.emit(SocketEvent.AdminCacheVideos, Settings.getSettings().cacheVideos)
    Player.setCacheVideos(value)
  }},

  [SocketEvent.AdminCacheBumpers]: { adminOnly: true, run: (socket, value?: boolean) => {
    if (value === undefined) return socket.emit(SocketEvent.AdminCacheBumpers, Settings.getSettings().cacheBumpers)
    Player.setCacheBumpers(value)
  }},
}