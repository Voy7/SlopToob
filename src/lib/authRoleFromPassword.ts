import Env from '@/server/EnvVariables'
import { AuthRole } from '@/lib/enums'

// Get the auth role based on given password, return null if invalid.
export default function authRoleFromPassword(password: string): AuthRole | null {
  if (password === Env.USER_PASSWORD) return AuthRole.Normal
  if (password === Env.ADMIN_PASSWORD) return AuthRole.Admin
  return null
}
