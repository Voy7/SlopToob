import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
// import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'

ffmpeg.setFfmpegPath(ffmpegPath!)
// ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

export default ffmpeg

export const transcodeArgs = [
  // -preset veryfast -vf "scale='min(1920,iw)':-2" -c:v libx264 -crf 23 -pix_fmt yuv420p -map 0:v:0 -c:a aac -ac 2 -b:a 192k -map 0:a:0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8
  '-preset veryfast',
  // `-vf "scale='min(1920,iw)':-2"`,
  '-c:v libx264',
  '-crf 23',
  '-pix_fmt yuv420p',
  '-map 0:v:0',
  '-c:a aac',
  '-ac 2',
  '-b:a 192k',
  '-map 0:a:0',
  '-start_number 0',
  '-hls_time 10',
  '-hls_list_size 0',
  '-f hls'
]