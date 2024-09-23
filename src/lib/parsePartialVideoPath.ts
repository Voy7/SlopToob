import path from 'path'
import Env from '@/server/EnvVariables'

// Parse a POSSIBLY partial video path (from client-side) to a full path
export default function parsePartialVideoPath(filepath: string, isBumper: boolean): string {
  if (filepath.startsWith(Env.VIDEOS_PATH)) return filepath
  if (filepath.startsWith(Env.BUMPERS_PATH)) return filepath

  return isBumper
    ? path.join(Env.BUMPERS_PATH, filepath).replace(/\\/g, '/')
    : path.join(Env.VIDEOS_PATH, filepath).replace(/\\/g, '/')
}
