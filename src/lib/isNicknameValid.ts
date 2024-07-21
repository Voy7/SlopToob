import Settings from '@/stream/Settings'

// Check if given nickname is valid given the rules
// Returns true if valid, or an error message if invalid
export default function isNicknameValid(name: string): true | string {
  if (name.length < Settings.nicknameMinLength)
    return `Nickname must be at least ${Settings.nicknameMinLength} characters.`
  if (name.length > Settings.nicknameMaxLength)
    return `Nickname must be at most ${Settings.nicknameMaxLength} characters.`

  // Can only contain letters, numbers, underscores, and spaces
  if (Settings.nicknameOnlyAlphanumeric) {
    const alphanumeric = /^[a-zA-Z0-9_ ]+$/
    if (!alphanumeric.test(name)) return 'Nickname must be alphanumeric.'
  }

  return true
}
