import 'colors'
import parseTorrentName from '@/server/utils/parseTorrentName'

const EXPECT = {
  'C:/Videos/Family_Guy_s10e03_random_title.MP4': 'Family Guy - S10E03 - Random Title',
  'C:/Videos/Family_Guy_10x3_random_title.mkv': 'Family Guy - S10E03 - Random Title',
  '/mnt/yt/4F8jxx91mmk389z1-1-video.mp4': '4F8jxx91mmk389z1-1-video',
  'American Dad (2005) S20e01 Fellow Traveler (1080p Dsnp Webrip X265 10bit Eac3 5 1 - Goki)[Taoe].mkv':
    'American Dad (2005) - S20E01 - Fellow Traveler',
  'The.Eric.Andre.Show.S01E07.1080p.WEB-DL.AAC2.0.H.264-BTN': 'The Eric Andre Show - S01E07',
  'SpongeBob Squarepants S03E01 - Mermaid Man and Barnacle Boy IV':
    'SpongeBob Squarepants - S03E01 - Mermaid Man And Barnacle Boy IV',
  'S01E01 Desmonds Big Day Out (2022)': 'S01E01 - Desmonds Big Day Out (2022)',
  'Smiling Friends s02e01 Hdtv Dd5 1 H 264-Intuol': 'Smiling Friends - S02E01'
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
  console.log(`\n${failCount}/${Object.keys(EXPECT).length} test(s) failed!`.white.bgRed)
  process.exit(1)
}
console.log(`\nAll tests passed!`.white.bgGreen)
