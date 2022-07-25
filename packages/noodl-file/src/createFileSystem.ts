export interface CreateFileSystemOptions {
  copyFile: (src: string, target: string) => void
  ensureDir: (dir: string) => void
  exists: (p: string) => boolean
  isFile: (p: string) => boolean
  isDir: (p: string) => boolean
  moveFile: (src: string, target: string) => void
  readFile: (p: string, encoding?: string) => string
  readdir: (dir: string) => string[]
  removeFile: (p: string) => void
  writeFile: (p: string, data: any) => void
}

export type FileSystem = ReturnType<typeof createFileSystem>

function createFileSystem(opts?: CreateFileSystemOptions) {
  /**
   * Ensures that the string ends with ext
   * @param { string } str
   * @param { string } ext
   * @returns { string }
   */
  function ensureExt(str: string, ext: string) {
    if (str && ext) {
      if (!ext.startsWith('.')) ext = `.${ext}`
      if (!str.endsWith(ext)) return `${str}${ext}`
      if (str.endsWith('.')) return `${str}${ext.substring(1)}`
    }
    return str
  }

  const fs = {
    copyFile: opts?.copyFile,
    ensureDir: opts?.ensureDir,
    ensureExt,
    exists: opts?.exists,
    isFile: opts?.isFile,
    isDir: opts?.isDir,
    moveFile: opts?.moveFile,
    readFile: opts?.readFile,
    readdir: opts?.readdir,
    removeFile: opts?.removeFile,
    writeFile: opts?.writeFile,
  }

  return fs
}

export default createFileSystem
