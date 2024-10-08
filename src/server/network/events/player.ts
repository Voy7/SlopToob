import Events from '@/server/network/Events'
import Player from '@/server/stream/Player'
import Settings from '@/server/core/Settings'
import Chat from '@/server/stream/Chat'
import Video from '@/server/stream/Video'
import { socketClients } from '@/server/network/socketClients'
import type { Socket } from 'socket.io'
import type { AddQueueVideoPayload } from '@/typings/socket'

function userSkippedVideoMessage(socket: Socket) {
  const client = socketClients.find((c) => c.socket === socket)
  if (!client || !Settings.sendAdminSkip) return
  Chat.send({ type: Chat.Type.AdminSkip, message: `${client.username} skipped the video.` })
}

// Admin pauses the stream
Events.add(Events.Msg.AdminPauseStream, {
  adminOnly: true,
  run: (socket) => {
    const wasSuccess = Player.pause()
    const client = socketClients.find((c) => c.socket === socket)
    if (!client || !wasSuccess || !Settings.sendAdminPause) return
    Chat.send({ type: Chat.Type.AdminPause, message: `${client.username} paused the stream.` })
  }
})

// Admin unpauses the stream
Events.add(Events.Msg.AdminUnpauseStream, {
  adminOnly: true,
  run: (socket) => {
    const wasSuccess = Player.unpause()
    const client = socketClients.find((c) => c.socket === socket)
    if (!client || !wasSuccess || !Settings.sendAdminUnpause) return
    Chat.send({ type: Chat.Type.AdminUnpause, message: `${client.username} unpaused the stream.` })
  }
})

// Admin skips the current video
Events.add(Events.Msg.AdminSkipVideo, {
  adminOnly: true,
  run: (socket) => {
    Player.skip()
    userSkippedVideoMessage(socket)
  }
})

// Admin goes to the previous video (or seek to start if conditions met)
Events.add(Events.Msg.AdminPreviousVideo, {
  adminOnly: true,
  run: (socket) => {
    const didPrevious = Player.previous()
    if (!didPrevious) return
    const client = socketClients.find((c) => c.socket === socket)
    if (!client || !Settings.sendAdminPrevious) return
    Chat.send({
      type: Chat.Type.AdminPrevious,
      message: `${client.username} went to the previous video.`
    })
  }
})

// Admin seeks to a specific time (seconds) in the video
Events.add(Events.Msg.AdminSeekTo, {
  adminOnly: true,
  run: (socket, seconds: number) => {
    Player.playing?.seekTo(seconds)
  }
})

// Admin seeks forward by specific seconds
Events.add(Events.Msg.AdminSeekStepForward, {
  adminOnly: true,
  run: (socket, seconds: number) => {
    Player.playing?.seekTo(Player.playing.currentSeconds + seconds)
  }
})

// Admin seeks backward by specific seconds
Events.add(Events.Msg.AdminSeekStepBackward, {
  adminOnly: true,
  run: (socket, seconds: number) => {
    Player.playing?.seekTo(Player.playing.currentSeconds - seconds)
  }
})

// Admin adds a video to the queue
Events.add(Events.Msg.AdminAddQueueVideo, {
  adminOnly: true,
  run: (socket, payload: AddQueueVideoPayload) => {
    const isCurrentPlaying = !!Player.playing
    const video = new Video(payload.videoPath, payload.isBumper, payload.fromPlaylistID)
    Player.addVideo(video, payload.toStart)
    if (isCurrentPlaying && payload.skipCurrent) {
      Player.skip()
      userSkippedVideoMessage(socket)
    }
  }
})

// Admin removes specified video from the queue
Events.add(Events.Msg.AdminRemoveQueueVideo, {
  adminOnly: true,
  run: (socket, videoID: string) => {
    Player.removeVideoFromQueue(videoID)
  }
})
