import Env from '@/server/EnvVariables'

// Logger class, singleton
export default new (class Logger {
  public info(message: any, ...args: any[]) {
    // Informational messages
    this.send(message, 'INFO'.cyan, ...args)
  }
  public warn(message: any, ...args: any[]) {
    // Warning messages
    this.send(message, 'WARN'.yellow, ...args)
  }
  public error(message: any, ...args: any[]) {
    // Error messages
    this.send(message, 'ERROR'.red, ...args)
  }
  public debug(message: any, ...args: any[]) {
    // Debug messages
    if (Env.PROJECT_MODE != 'development') return
    this.send(message, 'DEBUG'.magenta, ...args)
  }

  // Private method that sends the message with fancy styling
  private send(message: any, label: string, ...args: any[]) {
    console.log(`[`.gray + label + `] `.gray + message, ...args)
  }
})()
