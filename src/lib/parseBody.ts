import { IncomingMessage } from "http";

// Custom function to parse JSON body from a POST request
export default async function parseBody<T>(req: IncomingMessage): Promise<T | null> {
  try {
    return new Promise(resolve => {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString() // convert Buffer to string
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(body) as T)
        } catch (err) {
          console.error('Error parsing JSON body:', err)
          resolve(null)
        }
      })
    })
  }
  catch (error) {
    return null
  }
}