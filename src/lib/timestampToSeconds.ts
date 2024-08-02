// Parse timestamp to seconds
// Example input: 01:23:45.56
export default function timestampToSeconds(timestamp: string): number {
  timestamp = timestamp.split('.')[0]
  const [hours, minutes, seconds] = timestamp.split(':').map(parseFloat)
  return hours * 3600 + minutes * 60 + seconds
}
