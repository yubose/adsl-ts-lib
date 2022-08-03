import * as u from '@jsmanifest/utils'
import path from 'path'
import Strategy from './strategy'
import loadFile from '../utils/load-file'
import { file as isFile } from '../utils/is'
import { _id, StrategyKind } from '../constants'
import type { LoaderCommonOptions } from '../types'

class FileStrategy extends Strategy {
  #id: string

  constructor() {
    super()
    this.#id = u.getRandomKey()
  }

  get kind() {
    return StrategyKind.Url
  }

  get id() {
    return this.#id
  }

  is(value: unknown) {
    return isFile(value)
  }

  /**
   * @param value String or URL
   * @param Options
   * @returns The value formatted into a URL
   */
  format(
    value: string,
    options: LoaderCommonOptions & { name?: string; ext?: string },
  ) {
    if (path.isAbsolute(value)) {
      return value
    }

    const cwd = process.cwd()

    if (value.startsWith(cwd)) {
      return value
    }

    return path.resolve(cwd, value)
  }

  parse(value: string, options: LoaderCommonOptions) {
    let filepath = value
    let { base: filename, name, ext, dir } = path.parse(filepath)
    if (ext.startsWith('.')) ext = ext.substring(1)
    return { dir, filename, name, ext, value }
  }

  /**
   * @param value File path string
   *
   * @example
   * ```js
   * await load('./app/meetd2.yml')
   * await load('./app/cadlEndpoint.yml')
   * ```
   */
  async load(value: string) {
    return loadFile(value)
  }
}

export default FileStrategy
