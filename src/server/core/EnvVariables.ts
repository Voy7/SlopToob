import dotenv from 'dotenv'
import path from 'path'

const { parsed: env } = dotenv.config()
const dirname = path.resolve()

// Properly parse path variables, and return default if undefined
function parsePath(envPath: string | undefined, defaultPath: string, additional?: string): string {
  if (!envPath) {
    return path.resolve(path.join(dirname, defaultPath, additional || '')).replace(/\\/g, '/')
  }
  if (path.isAbsolute(envPath) || envPath.match(/^[a-zA-Z]:/)) {
    return path.resolve(path.join(envPath, additional || '')).replace(/\\/g, '/')
  }
  return path.resolve(path.join(dirname, envPath, additional || '')).replace(/\\/g, '/')
}

// All project's environment variables
class EnvVariables {
  readonly PROJECT_MODE = process.env?.NODE_ENV || 'development'
  readonly SERVER_URL = env?.SERVER_URL || 'http://localhost'
  readonly SERVER_PORT = parseInt(env?.SERVER_PORT || '3000') || 3000
  readonly SECRET_KEY = env?.SECRET_KEY || 'secret'
  readonly USER_PASSWORD = env?.USER_PASSWORD || 'user'
  readonly ADMIN_PASSWORD = env?.ADMIN_PASSWORD || 'admin'
  readonly VIDEOS_PATH = parsePath(env?.VIDEOS_PATH, '/videos')
  readonly VIDEOS_OUTPUT_PATH = parsePath(env?.OUTPUT_PATH, 'output', 'videos-transcoded')
  readonly BUMPERS_PATH = parsePath(env?.OUTPUT_PATH, 'output', 'bumpers')
  readonly BUMPERS_OUTPUT_PATH = parsePath(env?.OUTPUT_PATH, 'output', 'bumpers-transcoded')
  readonly THUMBNAILS_OUTPUT_PATH = parsePath(env?.OUTPUT_PATH, 'output', 'thumbnails')
  readonly VIDEO_LOGGER_OUTPUT_PATH = parsePath(env?.OUTPUT_PATH, 'output', 'video-logs')
  readonly DEV_FILE_TREE_TEST = env?.FILE_TREE_TEST === 'true'
}

export default new EnvVariables()

export async function checkRequiredVariables() {
  const { default: Checklist } = await import('@/server/core/Checklist')

  const missing: string[] = []

  if (!env?.SERVER_URL) missing.push('SERVER_URL')
  if (!env?.SERVER_PORT) missing.push('SERVER_PORT')
  if (!env?.SECRET_KEY) missing.push('SECRET_KEY')
  if (!env?.USER_PASSWORD) missing.push('USER_PASSWORD')
  if (!env?.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD')
  if (!env?.VIDEOS_PATH) missing.push('VIDEOS_PATH')

  // If any required variables are missing, fail the check
  if (missing.length) {
    Checklist.fail(
      'environmentVariables',
      'Missing environment variables, see error below. ',
      'Missing required environment variables. ' +
        '\n\n  Please create a .env file in the root directory with the following variables:\n'
          .white +
        missing.map((variable) => '  ■ '.gray + variable.yellow).join('\n')
    )
    return
  }

  Checklist.pass('environmentVariables', 'All required environment variables are set.')
}
