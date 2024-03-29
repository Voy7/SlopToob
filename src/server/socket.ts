import fs from 'fs/promises'
import path from 'path'
import { Server, type Socket } from 'socket.io'
import { httpServer } from '@/server/httpServer'
import { AuthRole, SocketEvent } from '@/lib/enums'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import Env from '@/EnvVariables'
import Player from '@/stream/Player'
import type { JoinStreamPayload, Client, Viewer, EditPlaylistNamePayload, EditPlaylistVideosPayload } from '@/typings/socket'
import Logger from '@/lib/Logger'

export const clients: Client[] = []

export let io: Server | null = null

// Socket server must be initialized after Next.js is ready
export function initializeSocketServer() {
  io = new Server(httpServer, {
    maxHttpBufferSize: 50e6 // Max 50MB message size (mainly for uploading bumper videos)
  })

  io.on('connection', (socket) => {
    // If client disconnects, remove them from the viewers list and broadcast new list
    socket.on('disconnect', () => {
      const index = clients.findIndex(c => c.socket === socket)
      if (index !== -1) clients.splice(index, 1)
      broadcast(SocketEvent.ViewersList, getViewersList())
    })

    // Message sent from client on first connection, adds them to the viewers list
    socket.on(SocketEvent.JoinStream, (payload: JoinStreamPayload) => {
      const authRole = authRoleFromPassword(payload.password)
      if (authRole === null) return

      clients.push({
        socket: socket,
        secret: payload.secret,
        username: payload.username,
        role: authRole
      })
      broadcast(SocketEvent.ViewersList, getViewersList())

      const streamInfo = Player.getStreamInfo()
      socket.emit(SocketEvent.StreamInfo, streamInfo)
    })

    // Client changed their username, update the viewers list
    socket.on(SocketEvent.ChangeUsername, (newUsername: string) => {
      // console.log('Viewer changed username:', newUsername)
      const client = clients.find(c => c.socket === socket)
      if (client) client.username = newUsername
      broadcast(SocketEvent.ViewersList, getViewersList())
    })

    // Admin first admin panel load, send all needed data
    socket.on(SocketEvent.AdminRequestAllData, async () => {
      const tree = await Player.getVideosFileTree()
      const playlists = Player.clientPlaylists
      socket.emit(SocketEvent.AdminRequestFileTree, tree)
      socket.emit(SocketEvent.AdminRequestPlaylists, playlists)
    })

    // Add new playlist, send event code back to confirm success, and globally broadcast new playlists list
    socket.on(SocketEvent.AdminAddPlaylist, async (name: string) => {
      const newPlaylistID = await Player.addPlaylist(name)
      socket.emit(SocketEvent.AdminAddPlaylist, newPlaylistID)
      broadcastAdmin(SocketEvent.AdminRequestPlaylists, Player.clientPlaylists)
    })

    // Delete playlist
    socket.on(SocketEvent.AdminDeletePlaylist, async (playlistID: string) => {
      await Player.deletePlaylist(playlistID)
      broadcastAdmin(SocketEvent.AdminRequestPlaylists, Player.clientPlaylists)
    })

    // Edit playlist name, send event back if error occurs
    socket.on(SocketEvent.AdminEditPlaylistName, async (payload: EditPlaylistNamePayload) => {
      const errorMsg = await Player.editPlaylistName(payload.playlistID, payload.newName)
      if (errorMsg) {
        socket.emit(SocketEvent.AdminEditPlaylistName, errorMsg)
      }
      broadcastAdmin(SocketEvent.AdminRequestPlaylists, Player.clientPlaylists)
    })

    // Edit playlist videos
    socket.on(SocketEvent.AdminEditPlaylistVideos, async (payload: EditPlaylistVideosPayload) => {
      await Player.setPlaylistVideos(payload.playlistID, payload.newVideoPaths)
      broadcastAdmin(SocketEvent.AdminRequestPlaylists, Player.clientPlaylists)
    })

    // Upload bumper video, response is error or success message
    socket.on(SocketEvent.AdminUploadBumper, async (payload: unknown) => {
      try {
        if (!payload) throw new Error('Payload is null.')
        if (typeof payload !== 'object') throw new Error('Payload must be an object.')
        if (!('name' in payload) || typeof payload.name !== 'string') throw new Error('payload.name must be a string.')
        if (!('videoFile' in payload) || typeof payload.videoFile !== 'string') throw new Error('payload.videoFile must be a string.')

        const fileExtension = payload.videoFile.split(',')[0].split('/')[1].split(';')[0]
        const sizeMB = Buffer.from(payload.videoFile.split(',')[1], 'base64').length / 1024 / 1024
        Logger.debug(`Uploading bumper video: ${payload.name}.${fileExtension} (Size: ${sizeMB.toFixed(1)}MB)`)

        // Save file to disk
        const filePath = path.join(Env.OUTPUT_PATH, 'bumpers', `${payload.name}.${fileExtension}`)
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, Buffer.from(payload.videoFile.split(',')[1], 'base64'))

        Logger.debug(`Bumper video uploaded successfully: ${filePath}`)
        socket.emit(SocketEvent.AdminUploadBumper, { success: true })
      }
      catch (error: any) { socket.emit(SocketEvent.AdminUploadBumper, { error: error.message }) }
    })
  })
}

// Send message to all viewers
export function broadcast(event: SocketEvent, payload: any) {
  clients.forEach(client => {
    client.socket.emit(event, payload)
  })
}

export function broadcastAdmin(event: SocketEvent, payload: any) {
  for (const client of clients) {
    if (client.role < AuthRole.Admin) continue
    client.socket.emit(event, payload)
  }
}

export function broadcastViewersList() {
  broadcast(SocketEvent.ViewersList, getViewersList())
}

// Create viewers list object from clients array
function getViewersList(): Viewer[] {
  const viewers: Viewer[] = []
  for (const client of clients) {
    viewers.push({
      socketID: client.socket.id,
      username: client.username,
      role: client.role
    })
  }
  return viewers
}

export function broadcastStreamInfo() {
  const info = Player.getStreamInfo()
  broadcast(SocketEvent.StreamInfo, info)
}