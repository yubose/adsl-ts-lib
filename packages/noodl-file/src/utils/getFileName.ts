import path from '../path'

function getFileName(filepath: string, parseFilePath = path.parse) {
  return parseFilePath(filepath).base
}

export default getFileName
