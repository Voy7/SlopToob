import dotenv from 'dotenv'
import path from 'path'

const { parsed } = dotenv.config()
const dirname = path.resolve()

// Properly parse path variables, and return default if undefined
function parsePath(envPath: string | undefined, defaultPath: string): string {
  if (!envPath) {
    return path.resolve(path.join(dirname, defaultPath))
  }
  if (path.isAbsolute(envPath) || envPath.match(/^[a-zA-Z]:/)) {
    return path.resolve(envPath)
  }
  return path.resolve(path.join(dirname, envPath))
}

// All project's environment variables
export default new class EnvVariables {
  readonly PROJECT_MODE: string = parsed?.PROJECT_MODE || 'development'
  readonly SERVER_HOST: string = parsed?.SERVER_HOST || 'localhost'
  readonly SERVER_PORT: number = parseInt(parsed?.SERVER_PORT || '3000') || 3000
  readonly USER_PASSWORD: string = parsed?.USER_PASSWORD || 'user'
  readonly ADMIN_PASSWORD: string = parsed?.ADMIN_PASSWORD || 'admin'
  readonly OUTPUT_PATH: string = parsePath(parsed?.OUTPUT_PATH, 'default_output')
  readonly VIDEOS_PATH: string = parsePath(parsed?.VIDEOS_PATH, 'default_videos')
  readonly BUMPERS_PATH: string = parsePath(parsed?.OUTPUT_PATH + '/bumpers', 'default_videos')
}