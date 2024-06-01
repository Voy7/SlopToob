import dotenv from 'dotenv'
import path from 'path'
import { passCheck, failCheck } from '@/stream/initChecks'

const { parsed } = dotenv.config()
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
export default new class EnvVariables {
  readonly PROJECT_MODE: string = process.env?.NODE_ENV || 'development'
  readonly SERVER_HOST: string = parsed?.SERVER_HOST || 'localhost'
  readonly SERVER_PORT: number = parseInt(parsed?.SERVER_PORT || '3000') || 3000
  readonly USER_PASSWORD: string = parsed?.USER_PASSWORD || 'user'
  readonly ADMIN_PASSWORD: string = parsed?.ADMIN_PASSWORD || 'admin'
  readonly VIDEOS_PATH: string = parsePath(parsed?.VIDEOS_PATH, '/videos')
  readonly VIDEOS_OUTPUT_PATH: string = parsePath(parsed?.OUTPUT_PATH, 'output', 'videos-transcoded')
  readonly BUMPERS_PATH: string = parsePath(parsed?.OUTPUT_PATH, 'output', 'bumpers')
  readonly BUMPERS_OUTPUT_PATH: string = parsePath(parsed?.OUTPUT_PATH, 'output', 'bumpers-transcoded')
  readonly THUMBNAILS_OUTPUT_PATH: string = parsePath(parsed?.OUTPUT_PATH, 'output', 'thumbnails')
  readonly DEV_FILE_TREE_TEST: boolean = parsed?.FILE_TREE_TEST === 'true'
}

function checkRequiredVariables() {
  const missing: string[] = []

  if (!parsed?.VIDEOS_PATH) missing.push('VIDEOS_PATH')
  if (!parsed?.USER_PASSWORD) missing.push('USER_PASSWORD')
  if (!parsed?.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD')

  // If any required variables are missing, fail the check
  if (missing.length) {
    failCheck('environmentVariables', 'Missing required environment variables. ' + '\n\n  Please create a .env file in the root directory with the following variables:\n'.white + missing.map(variable => '  ■ '.gray + variable.yellow).join('\n'))
    return
  }

  passCheck('environmentVariables', 'All required environment variables are set.')
}

checkRequiredVariables()