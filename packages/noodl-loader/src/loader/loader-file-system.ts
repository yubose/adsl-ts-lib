import { fp } from 'noodl-core'
import {
  existsSync,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
} from 'fs'
import FileSystemHost from '../file-system'

class LoaderFileSystemHost extends FileSystemHost {
  constructor() {
    super()
  }

  existsSync(filepath: string) {
    return existsSync(filepath)
  }

  readdir(...args: Parameters<FileSystemHost['readdir']>): Promise<string[]> {
    return new Promise((resolve, reject) => {
      readdir(...args, (err, files) => {
        if (err) reject(err)
        else resolve(files)
      })
    })
  }

  readdirSync(...args: Parameters<FileSystemHost['readdirSync']>) {
    return readdirSync(...args)
  }

  readFile(
    ...args: Parameters<FileSystemHost['readFile']>
  ): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
      const opts = { encoding: 'utf8' } as any
      if (args[1] && typeof args[1] === 'object') {
        fp.assign(opts, args[1])
      } else if (typeof args[1] === 'string') {
        opts.encoding = args[1]
      }
      readFile(args[0], opts, (err, file) => {
        if (err) reject(err)
        else resolve(file)
      })
    })
  }

  readFileSync(
    ...args: Parameters<FileSystemHost['readFileSync']>
  ): string | Buffer {
    return readFileSync(...args)
  }

  writeFile(...args: Parameters<FileSystemHost['writeFile']>): Promise<void> {
    return new Promise((resolve, reject) => {
      const opts = { encoding: 'utf8' } as any

      if (typeof args[2] === 'string') {
        opts.encoding = args[2]
      }

      writeFile(args[0], args[1], opts, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  writeFileSync(...args: Parameters<FileSystemHost['writeFileSync']>) {
    return writeFileSync(...args)
  }
}

export default LoaderFileSystemHost
