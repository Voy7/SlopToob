import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
// import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'

ffmpeg.setFfmpegPath(ffmpegPath!)
// ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

export default ffmpeg