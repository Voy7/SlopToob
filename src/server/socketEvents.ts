import fs from 'fs/promises'
import path from 'path'
import { socketClients } from '@/server/socketClients'
import { AuthRole, Msg } from '@/lib/enums'
import { getClientBumpers } from '@/stream/bumpers'
import generateSecret from '@/lib/generateSecret'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import isNicknameValid from '@/lib/isNicknameValid'
import Env from '@/EnvVariables'
import Logger from '@/server/Logger'
import Player from '@/stream/Player'
import TranscoderQueue from '@/stream/TranscoderQueue'
import PlayHistory from '@/stream/PlayHistory'
import SocketUtils from '@/lib/SocketUtils'
import Settings from '@/stream/Settings'
import FileTreeHandler from '@/stream/FileTreeHandler'
import VoteSkipHandler from '@/stream/VoteSkipHandler'
import Chat from '@/stream/Chat'
import type { Socket } from 'socket.io'
import type {
  AuthenticatePayload,
  EditPlaylistNamePayload,
  EditPlaylistVideosPayload
} from '@/typings/socket'

type EventOptions = {
  allowUnauthenticated?: boolean // Allow unauthenticated users to run this event (default: false)
  adminOnly?: boolean // Only allow admin users to run this event (default: false)
  run: (socket: Socket, payload: any) => void
}

export const socketEvents: Record<string, EventOptions> = {
  // If client disconnects, remove them from the viewers list and broadcast new list
  [Msg.Disconnect]: {
    run: (socket) => {
      const existingClient = socketClients.find((c) => c.socket === socket)
      if (!existingClient) return
      socketClients.splice(socketClients.indexOf(existingClient), 1)

      if (!existingClient.isWatching) return

      VoteSkipHandler.removeVote(socket.id)
      VoteSkipHandler.resyncChanges()
      SocketUtils.broadcastViewersList()

      // Pause stream if 'pause when inactive' criteria is met
      if (Settings.pauseWhenInactive && socketClients.length <= 0) Player.playing?.pause(false)

      if (!Settings.sendLeftStream) return
      Chat.send({
        type: Chat.Type.Left,
        message: `${existingClient.username} left the stream.`
      })
    }
  },

  // First connection, only authenticates user, not in the stream / viewers list yet
  [Msg.Authenticate]: {
    allowUnauthenticated: true,
    run: (socket, payload: AuthenticatePayload) => {
      const existingClient = socketClients.find((c) => c.socket === socket)
      if (existingClient) return

      const authRole = authRoleFromPassword(payload.password)
      if (authRole === null) return

      socketClients.push({
        socket: socket,
        username: isNicknameValid(payload.username) === true ? payload.username : 'Anonymous',
        role: authRole,
        image: `/api/avatar/${generateSecret()}`,
        isWatching: false
      })

      socket.emit(Msg.Authenticate, true)
    }
  },

  // Subscribe to get stream info updates, show on viewers list, etc.
  [Msg.JoinStream]: {
    run: (socket) => {
      const client = socketClients.find((c) => c.socket === socket)
      if (!client || client.isWatching) return

      client.isWatching = true

      VoteSkipHandler.resyncChanges()
      SocketUtils.broadcastViewersList()

      socket.emit(Msg.StreamInfo, Player.clientStreamInfo)
      socket.emit(Msg.JoinStream, true)

      // Unpause stream if 'pause when inactive' was active
      if (Settings.pauseWhenInactive && !Settings.streamIsPaused) Player.unpause()

      if (!Settings.sendJoinedStream) return
      Chat.send({
        type: Chat.Type.Joined,
        message: `${client.username} joined the stream.`
      })
    }
  },

  // Client changed their nickname
  // Respond true if successful, string if error
  [Msg.ChangeNickname]: {
    run: (socket, newName: unknown) => {
      try {
        if (typeof newName !== 'string') throw new Error('Invalid payload.')

        const isValid = isNicknameValid(newName)
        if (typeof isValid === 'string') throw new Error(isValid)

        const client = socketClients.find((c) => c.socket === socket)
        if (!client) throw new Error('Socket not found.') // Should never happen

        const oldName = client.username
        client.username = newName

        socket.emit(Msg.ChangeNickname, true)
        SocketUtils.broadcastViewersList()

        if (!Settings.sendChangedNickname) return
        Chat.send({
          type: Chat.Type.NicknameChange,
          message: `${oldName} changed their nickname to: ${newName}`
        })
      } catch (error: any) {
        socket.emit(Msg.ChangeNickname, error.message)
      }
    }
  },

  // Client sent a chat message, respond with string if error
  [Msg.SendChatMessage]: {
    run: (socket, message: unknown) => {
      try {
        if (typeof message !== 'string') throw new Error('Invalid payload.')

        message = message.trim() // Remove leading/trailing whitespace

        if (typeof message !== 'string' || message.length === 0)
          throw new Error('Message cannot be empty.')
        if (message.length > Settings.chatMaxLength)
          throw new Error(`Max message length is ${Settings.chatMaxLength} characters.`)

        const client = socketClients.find((c) => c.socket === socket)
        if (!client) throw new Error('Socket not found.') // Should never happen

        Chat.send({
          type: Chat.Type.UserChat,
          username: client.username,
          role: client.role,
          image: client.image,
          message: message
        })
      } catch (error: any) {
        socket.emit(Msg.SendChatMessage, error.message)
      }
    }
  },

  // User votes to skip current video
  [Msg.VoteSkipAdd]: {
    run: (socket) => {
      VoteSkipHandler.addVote(socket.id)
      socket.emit(Msg.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
    }
  },

  // User removes their vote to skip current video
  [Msg.VoteSkipRemove]: {
    run: (socket) => {
      VoteSkipHandler.removeVote(socket.id)
      socket.emit(Msg.VoteSkipStatus, VoteSkipHandler.hasVoted(socket.id))
    }
  },

  // Admin first admin panel load, send all needed data
  [Msg.AdminRequestAllData]: {
    adminOnly: true,
    run: (socket) => {
      const playlists = Player.clientPlaylists
      const bumpers = getClientBumpers()

      socket.emit(Msg.AdminStreamInfo, Player.adminStreamInfo)
      socket.emit(Msg.AdminFileTree, FileTreeHandler.tree)
      socket.emit(Msg.AdminPlaylists, playlists)
      socket.emit(Msg.AdminBumpersList, bumpers)
      socket.emit(
        Msg.AdminQueueList,
        Player.queue.map((video) => video.clientVideo)
      )
      socket.emit(Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
      socket.emit(Msg.AdminHistoryStatus, PlayHistory.clientHistoryStatus)
    }
  },

  // Admin adds a new playlist
  [Msg.AdminAddPlaylist]: {
    adminOnly: true,
    run: async (socket, newPlaylistName: string) => {
      try {
        const newPlaylistID = await Player.addPlaylist(newPlaylistName)
        socket.emit(Msg.AdminAddPlaylist, newPlaylistID)
      } catch (error: any) {
        socket.emit(Msg.AdminAddPlaylist, { error: error.message })
      }
    }
  },

  // Admin deletes a playlist
  [Msg.AdminDeletePlaylist]: {
    adminOnly: true,
    run: async (socket, playlistID: string) => {
      const errorMsg = await Player.deletePlaylist(playlistID)
      if (errorMsg) socket.emit(Msg.AdminDeletePlaylist, errorMsg)
    }
  },

  // Admin edits a playlist name
  [Msg.AdminEditPlaylistName]: {
    adminOnly: true,
    run: async (socket, payload: EditPlaylistNamePayload) => {
      try {
        await Player.editPlaylistName(payload.playlistID, payload.newName)
      } catch (error: any) {
        socket.emit(Msg.AdminEditPlaylistName, error.message)
      }
    }
  },

  // Admin edits a playlist's videos, only send updated playlists to other admins
  [Msg.AdminEditPlaylistVideos]: {
    adminOnly: true,
    run: async (socket, payload: EditPlaylistVideosPayload) => {
      await Player.setPlaylistVideos(payload.playlistID, payload.newVideoPaths)
      const senderClient = socketClients.find((c) => c.socket === socket)
      if (!senderClient) return
      for (const client of socketClients) {
        if (client === senderClient || client.role !== AuthRole.Admin) continue
        client.socket.emit(Msg.AdminPlaylists, Player.clientPlaylists)
      }
    }
  },

  // Admin uploads a bumper
  // Respond true if successful, string if error
  [Msg.AdminUploadBumper]: {
    adminOnly: true,
    run: async (socket, payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') throw new Error('Invalid payload.')
        if (!('name' in payload) || typeof payload.name !== 'string')
          throw new Error('Invalid payload.')
        if (!('videoFile' in payload) || typeof payload.videoFile !== 'string')
          throw new Error('No video selected.')
        if (payload.name.length <= 0) throw new Error('Bumper title cannot be empty.')

        const bumperExt = payload.videoFile.split(';base64,')[0].split('/')[1]
        const bumperName = `${payload.name}.${bumperExt}`
        const bumperPath = path.join(Env.BUMPERS_PATH, bumperName)
        const bumperExists = await fs
          .access(bumperPath)
          .then(() => true)
          .catch(() => false)
        if (bumperExists) throw new Error('Bumper with that name already exists.')

        const base64 = payload.videoFile.split(';base64,').pop()
        if (!base64) throw new Error('Invalid base64 data.')
        await fs.writeFile(bumperPath, base64, { encoding: 'base64' })
        socket.emit(Msg.AdminUploadBumper, true)
      } catch (error: any) {
        socket.emit(Msg.AdminUploadBumper, error.message)
      }
    }
  },

  // Admin deletes a bumper
  // Respond true if successful, string if error
  [Msg.AdminDeleteBumper]: {
    adminOnly: true,
    run: async (socket, filePath: string) => {
      try {
        if (!filePath.startsWith(Env.BUMPERS_PATH))
          throw new Error('File is not in bumpers directory.')
        await fs.rm(filePath)
        Logger.debug(`Admin requested deleted bumper: ${filePath}`)
        socket.emit(Msg.AdminDeleteBumper, true)
      } catch (error: any) {
        socket.emit(Msg.AdminDeleteBumper, error.message)
      }
    }
  },

  // Admin clears history
  [Msg.AdminDeleteHistory]: {
    adminOnly: true,
    run: async (socket) => {
      await PlayHistory.clearAllHistory()
    }
  },

  // Admin pauses the stream
  [Msg.AdminPauseStream]: {
    adminOnly: true,
    run: (socket) => {
      const wasSuccess = Player.pause()
      const client = socketClients.find((c) => c.socket === socket)
      if (!client || !wasSuccess || !Settings.sendAdminPause) return
      Chat.send({ type: Chat.Type.AdminPause, message: `${client.username} paused the stream.` })
    }
  },

  // Admin unpauses the stream
  [Msg.AdminUnpauseStream]: {
    adminOnly: true,
    run: (socket) => {
      const wasSuccess = Player.unpause()
      const client = socketClients.find((c) => c.socket === socket)
      if (!client || !wasSuccess || !Settings.sendAdminUnpause) return
      Chat.send({
        type: Chat.Type.AdminUnpause,
        message: `${client.username} unpaused the stream.`
      })
    }
  },

  // Admin skips the current video
  [Msg.AdminSkipVideo]: {
    adminOnly: true,
    run: (socket) => {
      Player.skip()
      const client = socketClients.find((c) => c.socket === socket)
      if (!client || !Settings.sendAdminSkip) return
      Chat.send({ type: Chat.Type.AdminSkip, message: `${client.username} skipped the video.` })
    }
  }
}
