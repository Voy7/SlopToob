// Parse time in seconds to timestamp string
// Expect: h:m:SS
export default function parseTimestamp(timestamp: number | string): string {
  if (typeof timestamp !== 'number') timestamp = parseFloat(timestamp)
  if (typeof timestamp !== 'number') return '0:00'

  const hours = Math.floor(timestamp / 3600)
  const minutes = Math.floor((timestamp % 3600) / 60)
  const seconds = Math.floor(timestamp % 60)

  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
