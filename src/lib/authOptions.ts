import CredentialsProvider from 'next-auth/providers/credentials'
import Env from '@/EnvVariables'
import authRoleFromPassword from '@/lib/authRoleFromPassword'
import { AuthRole } from '@/lib/enums'
import type { AuthOptions } from 'next-auth'
import type { AuthUser } from '@/typings/types'

const authOptions: AuthOptions = ({ 
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {  
        if (credentials?.password) {
          const authUser = getAuthUser(credentials.password)
          if (authUser) return authUser as any
        }
        
        throw new Error('Invalid password provided.')
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.user = user
      return token
    },
    session: async ({ session, token }) => {
      const tokenUser = token.user as AuthUser | undefined
      if (tokenUser && tokenUser.password) {
        const authUser = getAuthUser(tokenUser.password)
        if (authUser) session.user = authUser
        else session.user = undefined as any
      }
      else session.user = undefined as any
      return session
    }
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/', // Error code passed in query string as ?error=
    newUser: '/stream'
  }
})

function getAuthUser(password: string): AuthUser | null {
  const role = authRoleFromPassword(password)
  if (role === null) return null

  return {
    password: password,
    role: role
  }
}

export default authOptions