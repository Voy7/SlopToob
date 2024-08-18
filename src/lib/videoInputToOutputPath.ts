import path from 'path'
import Env from '@/server/EnvVariables'

// Transform video input path to it's transcoder output path
export default function videoInputToOutputPath(inputPath: string, isBumper: boolean): string {
  const basePath = isBumper ? Env.BUMPERS_PATH : Env.VIDEOS_PATH
  const outputBasePath = isBumper ? Env.BUMPERS_OUTPUT_PATH : Env.VIDEOS_OUTPUT_PATH
  const newPath = inputPath
    .replace(basePath, '')
    // Parse out illegal file name characters, trust past me
    .replace(/[^a-zA-Z0-9-_.:\/\\]/g, '')
  return path.join(outputBasePath, newPath).replace(/\\/g, '/')
}
