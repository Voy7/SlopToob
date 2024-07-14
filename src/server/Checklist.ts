import 'colors'
import packageJSON from '@package' assert { type: 'json' }

const HEADER_MSG = `Starting up SlopToob v${packageJSON.version}...`.cyan

// Handle logging and misc for startup/initialization checks
const CHECKS = {
  environmentVariables: 'Environment Variables',
  // pathsValid: 'File Paths',
  settingsReady: 'Settings',
  fileTreeReady: 'File Tree',
  httpServerReady: 'HTTP Server',
  socketServerReady: 'Web Socket Server',
  nextAppReady: 'Next.js App',
  playerReady: 'Stream Player',
} as const

enum CheckStatus {
  Pending,
  Running,
  Passed,
  Failed
}

type CheckKey = keyof typeof CHECKS

const checks: Record<CheckKey, CheckStatus> = {} as any
for (const checkKey in CHECKS) {
  const check = checkKey as CheckKey
  checks[check] = CheckStatus.Pending
}

const MAX_CHECK_LENGTH = Math.max(...Object.values(CHECKS).map(v => v.length)) // Length of longest check name
const HEADER_LINES = HEADER_MSG.split('\n').length + 2 // +2 for padding
const START_TIME = Date.now()
const LOADING_DOTS_POS = 32

// Methods to update check status and print to console
export default new class Checklist {
  running(check: CheckKey, message: string = '') {
    checks[check] = CheckStatus.Running
    updateCheckLine(check, `  > `.yellow + `${CHECKS[check].padEnd(MAX_CHECK_LENGTH, ' ')}` + ` | ${message}`.gray)
  }

  pass(check: CheckKey, message: string = '') {
    checks[check] = CheckStatus.Passed
    updateCheckLine(check, `  √ `.green + `${CHECKS[check].padEnd(MAX_CHECK_LENGTH, ' ')}` + ` | ${message}`.gray)

    // If all checks have passed, print success message
    if (Object.values(checks).some(v => v !== CheckStatus.Passed)) return
    const elapsedSeconds = ((Date.now() - START_TIME) / 1000).toFixed(2)
    printStatus(`All checks passed in ${elapsedSeconds}s`.green)
  }

  fail(check: CheckKey, message: string = '') {
    checks[check] = CheckStatus.Failed
    updateCheckLine(check, `  X `.red + `${CHECKS[check].padEnd(MAX_CHECK_LENGTH, ' ')}` + ` | ${message}`.gray)
    printStatus(`Initialization failed, aborting startup!`.red)
    process.exit(1) // Exit process on failure
  }
}

console.clear()
console.log(
  `\n  ${HEADER_MSG}\n\n` +
  `${Object.values(CHECKS).map(check => `  ○ `.gray + check).join('\n')}\n\n\n`
)

function updateCheckLine(check: CheckKey, text: string) {
  const index = Object.keys(CHECKS).indexOf(check)
  process.stdout.write('\u001b[s')
  process.stdout.cursorTo(0, HEADER_LINES + index)
  process.stdout.write(text)
  process.stdout.write('\u001b[u')
  updateProgressLine()
}

const STATUS_LINE = HEADER_LINES + Object.keys(CHECKS).length + 1

function updateProgressLine() {
  process.stdout.write('\u001b[s')
  process.stdout.cursorTo(0, STATUS_LINE)
  process.stdout.write(`  Running initialization checks`.gray)
  process.stdout.write('\u001b[u')
}

let loadingStep = 0
let loadingInterval = setInterval(() => {
  process.stdout.write('\u001b[s')
  process.stdout.cursorTo(LOADING_DOTS_POS, STATUS_LINE)
  if (loadingStep === 0) process.stdout.write('   ')
  if (loadingStep === 1) process.stdout.write('.  ')
  if (loadingStep === 2) process.stdout.write('.. ')
  if (loadingStep === 3) process.stdout.write('...')
  process.stdout.write('\u001b[u')
  loadingStep++
  if (loadingStep > 3) loadingStep = 0
}, 250)

function printStatus(message: string) {
  process.stdout.write('\u001b[s')
  process.stdout.cursorTo(0, STATUS_LINE)
  process.stdout.write(`  ${message}`)
  process.stdout.write('\u001b[u')
  clearInterval(loadingInterval)
}