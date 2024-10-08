// import Env from '@/EnvVariables'
// import { AuthRole } from '@/shared/enums'

// // Get the auth role based on given password, return null if invalid.
// export default function authRoleFromPassword(password: string): AuthRole | null {
//   if (password === Env.USER_PASSWORD) return AuthRole.Normal
//   if (password === Env.ADMIN_PASSWORD) return AuthRole.Admin
//   return null
// }

// import Env from '@/EnvVariables'
import { AuthRole } from '@/shared/enums'

// Get the auth role based on given password, return null if invalid.
export default function authRoleFromPassword(password: string): AuthRole | null {
  if (password === process.env.USER_PASSWORD) return AuthRole.Normal
  if (password === process.env.ADMIN_PASSWORD) return AuthRole.Admin
  return null
}
