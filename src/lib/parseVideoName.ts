import { basename } from 'path'
import Settings from '@/server/Settings'

// If a title contains any of these, remove everything after it
const SUFFIX_SEPERATORS = [
  '360p',
  '480p',
  '720p',
  '1080p',
  '1440p',
  '2160p',
  'dvdrip',
  'webrip',
  'webdl',
  'web-dl',
  'bluray',
  'brrip',
  'bdrip',
  'hdtv',
  'web',
  'xvid',
  'ac3',
  'hdrip'
]

// Parse video name from path to client-friendly name
export default function parseVideoName(path: string): string {
  let name = basename(path) // File name
  if (name.includes('.')) name = name.substring(0, name.lastIndexOf('.')) // Remove extension if it exists
  name = name.replace(/_/g, ' ') // Underscores to spaces

  if (Settings.torrentNameParsing) {
    // Periods to spaces
    name = name.replace(/\./g, ' ')

    // Capatalize every word
    name = name.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )

    // Remove common suffixes
    for (const seperator of SUFFIX_SEPERATORS) {
      const index = name.toLowerCase().indexOf(seperator)
      if (index !== -1) name = name.substring(0, index)
    }

    // If a 'word' only contains 's', 'e', & numbers, it's a season/episode tag,
    // capatailize all letters and add '-' to each side
    name = name.replace(/s\d+e\d+/gi, (txt) => `- ${txt.toUpperCase()} -`)

    // Remove duplicate dashes (- -)
    name = name.replace(/- -/g, '-')

    // Remove any remaining whitespace
    name = name.trim()
  }

  return name
}
