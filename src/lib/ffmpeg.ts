import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import Env from '@/EnvVariables'

if (Env.FFMPEG_PATH) ffmpeg.setFfmpegPath(Env.FFMPEG_PATH)
else ffmpeg.setFfmpegPath(ffmpegStatic!)

export default ffmpeg