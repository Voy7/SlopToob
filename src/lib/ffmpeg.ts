import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'

ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

export default ffmpeg

export const TRANSCODE_ARGS = [
  '-preset veryfast',
  // `-vf "scale='min(1920,iw)':-2"`,
  '-c:v libx264',
  '-pix_fmt yuv420p',
  '-map 0:v:0',
  '-crf 23',
  '-c:a aac',
  '-ac 2',
  '-b:a 192k',
  '-map 0:a:0',
  '-start_number 0',
  '-hls_time 5',
  '-hls_list_size 0',
  '-f hls'
]

export const THUMBNAIL_ARGS = [
  '-vf scale=-1:480', // Scale to 420p height
  '-vframes 1', // Only 1 frame
  '-q:v 2' // Quality level
]
