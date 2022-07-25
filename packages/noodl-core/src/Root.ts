import * as fp from './utils/fp'
import { ARoot } from './types'
import * as c from './constants'

class Root extends ARoot {
  value = {} as Record<string, any>;

  [Symbol.iterator](): Iterator<[name: string, node: unknown]> {
    const entries = [...Object.entries(this.value)].reverse()
    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length as true
          },
        }
      },
    }
  }

  constructor() {
    super()
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: c._symbol.root,
    })
  }

  get(key: string) {
    return fp.get(this.value, key)
  }

  set(key: string, value: any): this {
    if (arguments.length) this.value[key] = value
    return this
  }

  init(): this {
    this.value = {}
    return this
  }

  remove(key: string): this {
    delete this.value[key]
    return this
  }
}

export default Root
