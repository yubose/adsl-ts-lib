import path from 'path-browserify'
import * as t from '../types'
import { _symbol } from '../constants'

class PathBrowserify extends t.APath {
  constructor() {
    super()
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: _symbol.path,
    })
  }

  dirname(p: string): string {
    return path.dirname(p)
  }

  extname(p: string): string {
    return path.extname(p)
  }

  isAbsolute(p: string): boolean {
    return path.isAbsolute(p)
  }

  join(...p: string[]): string {
    return path.join(...p)
  }

  normalize(p: string): string {
    return path.normalize(p)
  }

  parse(p: string): {
    root: string
    dir: string
    base: string
    ext: string
    name: string
  } {
    return path.parse(p)
  }

  relative(p1: string, p2: string): string {
    return path.relative(p1, p2)
  }

  resolve(...p: string[]): string
  resolve(p: string): string
  resolve(p?: any, ...rest: any[]): string {
    return path.resolve(p, ...rest)
  }
}

export default PathBrowserify
