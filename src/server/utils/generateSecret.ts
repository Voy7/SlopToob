const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// Generate 16 character secret key / id
export default function generateSecret() {
  let secret = ''
  for (let i = 0; i < 16; i++) {
    secret += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }
  return secret
}
