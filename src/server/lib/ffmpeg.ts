import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import { videoQualities } from '@/shared/data/videoQualities'
import { audioQualities } from '@/shared/data/audioQualities'

ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

export default ffmpeg

export const BASE_TRANSCODE_ARGS = [
  '-preset veryfast',
  '-c:v libx264',
  '-pix_fmt yuv420p',
  '-map 0:v:0',
  '-crf 23',
  '-c:a aac',
  '-ac 2',
  '-map 0:a:0',
  '-start_number 0',
  '-hls_time 5',
  '-hls_list_size 0',
  '-f hls'
]

export const THUMBNAIL_ARGS = [
  '-vframes 1', // Only 1 frame
  '-q:v 2' // Quality level
]

type VideoQualityID = (typeof videoQualities)[number]['id']

export const VIDEO_QUALITY_ARGS = {
  unlimited: null,
  '1440p': [`-vf scale='if(gt(iw,2560),2560,iw)':'if(gt(ih,1440),1440,ih)'`],
  '1080p': [`-vf scale='if(gt(iw,1920),1920,iw)':'if(gt(ih,1080),1080,ih)'`],
  '720p': [`-vf scale='if(gt(iw,1280),1280,iw)':'if(gt(ih,720),720,ih)'`],
  '480p': [`-vf scale='if(gt(iw,854),854,iw)':'if(gt(ih,480),480,ih)'`],
  '360p': [`-vf scale='if(gt(iw,640),640,iw)':'if(gt(ih,360),360,ih)'`],
  '144p': [`-vf scale='if(gt(iw,256),256,iw)':'if(gt(ih,144),144,ih)'`]
} satisfies Record<VideoQualityID, string[] | null>

type AudioQualityID = (typeof audioQualities)[number]['id']

export const AUDIO_QUALITY_ARGS = {
  unlimited: null,
  '320k': ['-b:a 320k'],
  '192k': ['-b:a 192k'],
  '128k': ['-b:a 128k'],
  '96k': ['-b:a 96k'],
  '64k': ['-b:a 64k'],
  '32k': ['-b:a 32k']
} satisfies Record<AudioQualityID, string[] | null>
