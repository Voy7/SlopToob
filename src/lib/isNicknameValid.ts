import Settings from '@/stream/Settings'

// Check if given nickname is valid given the rules
// Returns true if valid, or an error message if invalid
export default function isNicknameValid(name: string): true | string {
  const { nicknameOnlyAlphanumeric, nicknameMinLength, nicknameMaxLength } = Settings.getSettings()

  if (name.length < nicknameMinLength) return `Nickname must be at least ${nicknameMinLength} characters.`
  if (name.length > nicknameMaxLength) return `Nickname must be at most ${nicknameMaxLength} characters.`

  // Can only contain letters, numbers, underscores, and spaces
  if (nicknameOnlyAlphanumeric) {
    const alphanumeric = /^[a-zA-Z0-9_ ]+$/
    if (!alphanumeric.test(name)) return 'Nickname must be alphanumeric.'
  }

  return true
}