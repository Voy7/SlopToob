import Env from '@/EnvVariables'

// Logger class, singleton
export default new class Logger {
  public info(message: any) { // Informational messages
    this.send(message, 'INFO'.cyan)
  }
  public warn(message: any) { // Warning messages
    this.send(message, 'WARN'.yellow)
  }
  public error(message: any) { // Error messages
    this.send(message, 'ERROR'.red)
  }
  public debug(message: any) { // Debug messages, only sent in development mode
    if (Env.PROJECT_MODE != 'development') return
    this.send(message, 'DEBUG'.magenta)
  }

  // Private method that sends the message with fancy styling
  private send(message: any, label: string) {
    console.log(
      `[`.white +
      `${new Date().toLocaleString().split(' ')[1]}`.white +
      `] `.white +
      `[`.gray +
      label +
      `] `.gray +
      message
    )
  }
}