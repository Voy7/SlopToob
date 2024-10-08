import Events from '@/server/network/Events'
import { getClientBumpers } from '@/server/stream/bumpers'
import Logger from '@/server/core/Logger'
import Player from '@/server/stream/Player'
import TranscoderQueue from '@/server/stream/TranscoderQueue'
import PlayHistory from '@/server/stream/PlayHistory'
import SocketUtils from '@/server/network/SocketUtils'
import FileTreeHandler from '@/server/stream/FileTreeHandler'
import CacheHandler from '@/server/stream/CacheHandler'
import Schedule from '@/server/stream/Schedule'

// Admin first admin panel load, send all needed data
Events.add(Events.Msg.AdminRequestAllData, {
  adminOnly: true,
  run: (socket) => {
    const playlists = Player.clientPlaylists
    const bumpers = getClientBumpers()

    socket.emit(Events.Msg.AdminStreamInfo, Player.adminStreamInfo)
    socket.emit(Events.Msg.AdminFileTree, FileTreeHandler.tree)
    socket.emit(Events.Msg.AdminPlaylists, playlists)
    socket.emit(Events.Msg.AdminBumpersList, bumpers)
    socket.emit(Events.Msg.AdminQueueList, Player.clientVideoQueue)
    socket.emit(Events.Msg.AdminTranscodeQueueList, TranscoderQueue.clientTranscodeList)
    socket.emit(Events.Msg.AdminHistoryStatus, PlayHistory.clientHistoryStatus)
    socket.emit(Events.Msg.AdminCacheStatus, CacheHandler.getClientCacheStatus('videos'))
    socket.emit(Events.Msg.AdminCacheStatus, CacheHandler.getClientCacheStatus('bumpers'))
    socket.emit(Events.Msg.AdminCacheStatus, CacheHandler.getClientCacheStatus('thumbnails'))
    socket.emit(Events.Msg.AdminSendAllLogs, Logger.logs)
    socket.emit(Events.Msg.AdminSchedule, Schedule.clientSchedule)
    socket.emit(Events.Msg.AdminRichUsers, SocketUtils.clientRichUsers)
  }
})
