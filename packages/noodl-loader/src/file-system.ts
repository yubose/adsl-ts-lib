import type { Encoding } from './types'
import { _id, idKey } from './constants'

abstract class FileSystemHost {
  abstract readdir(path: string, encoding?: Encoding): Promise<string[]>

  abstract readdirSync(path: string, encoding?: Encoding): string[]

  abstract readFile(path: string, encoding?: Encoding): Promise<string | Buffer>

  abstract readFileSync(path: string, encoding?: Encoding): string | Buffer

  abstract writeFile(
    path: string,
    data: string,
    encoding?: Encoding,
  ): Promise<void>

  abstract writeFileSync(path: string, data: string, encoding?: Encoding): void

  constructor() {
    Object.defineProperty(this, idKey, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: _id.fileSystemHost,
    })
  }
}

export default FileSystemHost
