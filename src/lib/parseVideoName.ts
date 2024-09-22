import { basename } from 'path'
import parseTorrentName from '@/lib/parseTorrentName'
import Settings from '@/server/Settings'

// Parse video name from file path to client-friendly name
export default function parseVideoName(path: string): string {
  if (Settings.torrentNameParsing) {
    return parseTorrentName(path)
  }

  let name = basename(path) // File name
  if (name.includes('.')) name = name.substring(0, name.lastIndexOf('.')) // Remove extension if it exists
  return name.replace(/_/g, ' ') // Underscores to spaces
}
