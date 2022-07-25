import type fs from 'fs'
import * as t from './types'

class FileSystem extends t.AFileSystem {
  #fs: typeof fs

  constructor(fsProp: any) {
    super()
    this.#fs = fsProp
  }

  get fs() {
    return this.#fs
  }

  set fs(fs) {
    this.#fs = fs
  }

  async readFile(path: string) {
    // @ts-expect-error
    return this.fs.readFile(path, ...Array.from(arguments).slice(1))
  }

  readFileSync(...args: Parameters<typeof fs['readFileSync']>) {
    return this.fs.readFileSync(...args)
  }

  async writeFile(path: string, data: NodeJS.ArrayBufferView | string) {
    const args = [...arguments].slice(2)
    // @ts-expect-error
    return this.fs.writeFile(path, data, ...args)
  }

  writeFileSync(...args: Parameters<typeof fs['writeFileSync']>) {
    this.fs.writeFileSync(...args)
  }
}

export default FileSystem
