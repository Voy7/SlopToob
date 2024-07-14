// @ts-ignore
import Hls from 'hls-server'
import fs from 'fs'
import { httpServer } from '@/server/httpServer'
import Logger from '@/server/Logger'
import Player from '@/stream/Player'

// HLS server must be initialized after Next.js is ready
export function initializeHlsServer() {
  new Hls(httpServer, {
    provider: {
      exists: (req: any, cb: any) => {
        // console.log('Requesting', req.url.cyan)
        const segments = req.url.split('/')
        if (segments[1] !== 'stream-data') {
          return cb(null, true)
        }
        const id = segments[2]
        const filename = segments[3]
        const ext = filename.split('.').pop()
  
        if (ext !== 'm3u8' && ext !== 'ts') {
          return cb(null, true)
        }

        const video = Player.playing
        if (!video || video.id !== id) {
          // console.log('No video playing with ID:', id)
          return cb(null, false)
        }

        const filePath = `${video.outputPath}/${filename}`
  
        fs.access(filePath, fs.constants.F_OK, function (err) {
          if (err) {
            // console.log('File not exist')
            return cb(null, false)
          }
          cb(null, true)
        })
      },
      getManifestStream: (req: any, cb: any) => {
        // console.log('Requesting manifest', req.url)
        const stream = getFile(req)
        cb(null, stream)
      },
      getSegmentStream: (req: any, cb: any) => {
        // console.log('Requesting segment', req.url)
        const stream = getFile(req)
        cb(null, stream)
      }
    }
  })
}

function getFile(req: any) {
  const segments = req.url.split('/')
  const id = segments[2]
  const filename = segments[3]

  const video = Player.playing
  if (!video || video.id !== id) {
    Logger.warn('No video playing with ID:', id)
    return null
  }

  const filePath = `${video.outputPath}/${filename}`
  // console.log(`Reading file: ${filePath}`.yellow)
  
  const stream = fs.createReadStream(filePath)

  return stream
}