import 'colors'

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

type Check = keyof typeof CHECKS

const checks: Record<Check, boolean | null> = {} as any
for (const checkKey in CHECKS) {
  const check = checkKey as Check
  checks[check] = null
}

const startTime = Date.now()

// Length of longest check name
const maxCheckLength = Math.max(...Object.values(CHECKS).map(v => v.length))

export function passCheck(check: Check, message?: string) {
  checks[check] = true
  console.log(`  √ `.green + `${CHECKS[check].padEnd(maxCheckLength, ' ')}` + (message ? ` - ${message}`.gray : ''))
  
  // If all checks are done, print final message
  if (Object.values(checks).some(v => v === null)) return

  const isAllPassed = Object.values(checks).every(v => v === true)
  const secondsPassed = Math.round((Date.now() - startTime) / 100) / 10

  if (isAllPassed) {
    console.log(`\n  Initialization checks passed in ${secondsPassed}s, app is ready to go!\n`.green)
    return
  }
}

export function failCheck(check: Check, message?: string) {
  checks[check] = false
  console.log(`  X `.red + `${CHECKS[check].padEnd(maxCheckLength, ' ')}` + (message ? ` - ${message}`.gray : ''))
  console.log(`\n  Initialization checks failed, aborting startup.\n`.red)
  process.exit(1)
}