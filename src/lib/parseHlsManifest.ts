type Return = {
  seconds: number
  isEnded: boolean
}

// Parse an HLS m3u8 manifest to get the duration and see if it's ended
export default function parseHlsManifest(manifest: string): Return | null {
  // Segment line format: #EXTINF:10.000,
  const matches = manifest.match(/#EXTINF:(\d+\.\d+),/g)
  if (!matches) return null

  const seconds = matches.reduce((acc, val) => acc + parseFloat(val.split(':')[1]), 0) || 0
  const isEnded = manifest.includes('#EXT-X-ENDLIST')

  return { seconds, isEnded }
}
