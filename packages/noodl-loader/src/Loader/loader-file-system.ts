import { fp } from 'noodl-core'
import fs from 'fs-extra'
import FileSystemHost from '../file-system'

class LoaderFileSystemHost extends FileSystemHost {
  constructor() {
    super()
  }

  readdir(...args: Parameters<FileSystemHost['readdir']>) {
    return fs.readdir(...args)
  }

  readdirSync(...args: Parameters<FileSystemHost['readdirSync']>) {
    return fs.readdirSync(...args)
  }

  readFile(...args: Parameters<FileSystemHost['readFile']>) {
    const opts = { encoding: 'utf8' }
    if (args[1] && typeof args[1] === 'object') {
      fp.assign(opts, args[1])
    } else if (typeof args[1] === 'string') {
      opts.encoding = args[1]
    }
    return fs.readFile(args[0], opts)
  }

  readFileSync(
    ...args: Parameters<FileSystemHost['readFileSync']>
  ): string | Buffer {
    return fs.readFileSync(...args)
  }

  writeFile(...args: Parameters<FileSystemHost['writeFile']>) {
    return fs.writeFile(...args)
  }

  writeFileSync(...args: Parameters<FileSystemHost['writeFileSync']>) {
    return fs.writeFileSync(...args)
  }
}

export default LoaderFileSystemHost
