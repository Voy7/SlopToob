import Env from '@/server/EnvVariables'
import SocketUtils from '@/server/socket/SocketUtils'
import { Msg } from '@/lib/enums'

const logs: string[] = []

const ANSI_REMOVE_REGEX =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

// Logger class, singleton
export default class Logger {
  // Informational messages
  static info(...args: any[]) {
    this.send('INFO'.cyan, true, ...args)
  }
  // Warning messages
  static warn(...args: any[]) {
    this.send('WARN'.yellow, true, ...args)
  }
  // Error messages
  static error(...args: any[]) {
    this.send('ERROR'.red, true, ...args)
  }
  // Debug messages (only seen in development mode)
  static debug(...args: any[]) {
    this.send('DEBUG'.magenta, Env.PROJECT_MODE === 'development', ...args)
  }

  // Chat messages
  static chatMessage(...args: any[]) {
    this.send('CHAT'.blue, true, ...args)
  }

  // Private method that sends the message with fancy styling
  private static send(label: string, sendInConsole: boolean, ...args: any[]) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
    if (sendInConsole) console.log(`${timestamp} `.gray + label, ...args)
    const log = `${timestamp} ${label.reset} ${args.join(' ')}`.replace(ANSI_REMOVE_REGEX, '')
    logs.push(log)
    if (logs.length > 500) logs.shift()
    SocketUtils.broadcastAdmin(Msg.AdminNewLog, log)
  }

  static get logs() {
    return logs
  }
}
