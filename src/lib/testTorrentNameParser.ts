import 'colors'
import parseTorrentName from '@/lib/parseTorrentName'

const EXPECT = {
  'C;/Videos/Family Guy_s10e03_random_title.mp4': 'Family Guy - S10E03 - Random Title',
  'American Dad (2005) S20e01 Fellow Traveler (1080p Dsnp Webrip X265 10bit Eac3 5 1 - Goki)[Taoe].mkv':
    'American Dad (2005) - S20E01 - Fellow Traveler',
  'The.Eric.Andre.Show.S01E07.1080p.WEB-DL.AAC2.0.H.264-BTN': 'The Eric Andre Show - S01E07',
  'SpongeBob Squarepants S03E01 - Mermaid Man and Barnacle Boy IV':
    'SpongeBob Squarepants - S03E01 - Mermaid Man And Barnacle Boy IV',
  'S01E01 Desmonds Big Day Out (2022)': 'S01E01 - Desmonds Big Day Out (2022)',
  'Smiling Friends S02e01 1080p Hdtv Dd5 1 H 264-Intuol': 'Smiling Friends - S02E01 -'
}

console.clear()
console.log('\nTesting parseTorrentName...\n'.gray)

let failCount = 0
for (const [input, expected] of Object.entries(EXPECT)) {
  const result = parseTorrentName(input)
  if (result === expected) {
    console.log(`  √ `.green + ` ${input} `.gray + `->`.cyan + ` ${result}`.gray)
    continue
  }
  console.log(
    `\n  ` +
      `X`.white.bgRed +
      `  Input:`.cyan +
      ` ${input}\n` +
      `    Output:`.cyan +
      ` ${result}\n` +
      `    Expect:`.cyan +
      ` ${expected}\n`
  )
  failCount++
}

if (failCount) {
  console.log(`\n${failCount} test(s) failed!`.white.bgRed)
  process.exit(1)
}
console.log(`\nAll tests passed!`.white.bgGreen)
