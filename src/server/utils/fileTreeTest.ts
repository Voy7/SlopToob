import Env from '@/server/core/EnvVariables'
import generateSecret from '@/server/utils/generateSecret'

// Fake file tree data for testing purposes
const FOLDERS = 200
const FILES_PER_FOLDER = 500

export let fakePaths: string[] = []
for (let i = 0; i < FOLDERS; i++) {
  let folderName = generateSecret()
  for (let f = 0; f < FILES_PER_FOLDER; f++) {
    let fileName = generateSecret()
    fakePaths.push(`${Env.VIDEOS_PATH}/${i}-${folderName}/${f}-${fileName}.mp4`)
  }
}
