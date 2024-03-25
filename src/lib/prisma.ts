import { PrismaClient } from '@prisma/client'
import Logger from '@/lib/Logger'
// import { Roles } from '#src/lib/enums'

declare global {
  var prisma: PrismaClient
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// If Keys table is empty, create a default admin key
// async function createDefaultSettings() {
//   const keysCount = await prisma.settings.count()
//   if (keysCount > 0) return
//   const adminKey = await prisma.key.create({
//     data: {
//       apiKey: '1234',
//       name: 'Default Admin',
//       role: Roles.Admin
//     }
//   })
//   Logger.info(`Keys table was empty, created default admin key: ${adminKey.apiKey}`)
// }

// createDefaultSettings()

export default prisma