// Project entry point

import 'colors'
import '@/server/nextServer'
import Settings from '@/stream/Settings'

(async () => {
  const settings = await Settings.getSettings()
  console.log(settings)
})()

// import Player from '@/stream/Player'
// import Video from '@/stream/Video'

// Player.addVideo(new Video('1.mp4'))
// Player.addVideo(new Video('other/2.mp4'))
// Player.addVideo(new Video('other/3.mp4'))
