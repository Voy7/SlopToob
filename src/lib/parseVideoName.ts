import { basename } from 'path'

// Parse video name from path to client-friendly name
// TODO: Add more advanced parsing methods
export default function parseVideoName(path: string): string {
  let name = basename(path) // File name
  if (name.includes('.')) name = name.substring(0, name.lastIndexOf('.')) // Remove extension if it exists
  name = name.replace(/_/g, ' ') // Underscores to spaces
  name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) // Capatalize every word
  return name
}