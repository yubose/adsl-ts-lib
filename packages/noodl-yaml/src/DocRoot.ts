import y from 'yaml'
import { ARoot, is as coreIs } from 'noodl-core'
import DocDiagnosticsIterator from './DocDiagnosticsIterator'
import is from './utils/is'
import get from './utils/get'
import set from './utils/set'
import unwrap from './utils/unwrap'
import type { FileSystem } from './utils/fileSystem'
import * as c from './constants'

class DocRoot extends ARoot {
  #fs: Partial<FileSystem> | undefined
  #iterator: DocDiagnosticsIterator | undefined
  value = new Map<string, y.Document | y.Node>();

  [Symbol.iterator](): Iterator<
    [name: y.Scalar<string> | string, doc: y.Document | y.Node]
  > {
    if (this.#iterator) return this.#iterator.getIterator()
    const entries = Object.entries(this.value)

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

  /**
   * @deprecated
   */
  init() {
    this.value.clear()
    return this
  }

  clear() {
    this.value.clear()
    return this
  }

  /**
   * @param key Root key
   * @returns The retrieved value
   */
  get(key: string[] | y.Scalar | string) {
    return get(this.value, key)
  }

  /**
   * @param key Root key
   * @returns True if key exists in root
   */
  has(key: (y.Scalar | string)[] | y.Scalar | string) {
    const paths = (
      (is.scalarNode(key) && coreIs.str(key.value) && key.value) ||
      (coreIs.arr(key) && key.join('.')) ||
      (coreIs.str(key) && key) ||
      ''
    ).split('.')

    let node = this.value

    while (paths.length) {
      key = paths.shift() as string
      if (key) {
        if (node?.has?.(key)) {
          node = node.get(key) as any
        } else {
          return false
        }
      } else {
        return key === '' ? true : false
      }
    }

    return true
  }

  /**
   * NOTE: Value will be converted to a YAML Document if it is not a YAML Node unless it is a nullish value
   * @param key Root key
   * @param value Root value
   */
  set(key: y.Scalar | string, value: any) {
    if (
      value != null &&
      !y.isNode(value) &&
      !y.isDocument(value) &&
      !y.isPair(value) &&
      !y.isMap(value)
    ) {
      const doc = this.toDocument(value)
      // { SignIn: { SignIn: y.Document } } --> { SignIn: y.Document }
      if (y.isMap(doc.contents) && doc.contents.items.length === 1) {
        if (doc.has(key)) doc.contents = doc.get(key) as y.YAMLMap
      }
      value = doc
    }

    set(this.value, unwrap(key), value)
    // this.value.set(unwrap(key) as string, value)
    return this
  }

  remove(key: y.Scalar | string): this {
    this.value.delete(unwrap(key) as string)
    return this
  }

  toDocument(
    yml: Record<string, any> | string,
    opts?: y.DocumentOptions | y.ParseOptions | y.SchemaOptions,
  ) {
    opts = {
      logLevel: 'debug',
      lineCounter: new y.LineCounter(),
      keepSourceTokens: true,
      prettyErrors: true,
      ...opts,
    }
    return coreIs.str(yml)
      ? y.parseDocument(yml, opts)
      : new y.Document(yml, opts)
  }

  toJSON() {
    return [...this].reduce((acc, [name, doc]) => {
      acc[name as string] =
        coreIs.obj(doc) && 'toJSON' in doc ? doc.toJSON() : doc
      return acc
    }, {})
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }

  loadFileSync(
    filepath: string,
    opts?: {
      parseOptions?: y.DocumentOptions | y.ParseOptions | y.SchemaOptions
      renameFile?: (filename?: string) => string | void
      renameKey?: (filename: string) => string | void
    },
  ) {
    if (!this.#fs) {
      throw new Error(`Cannot load a file without a fileSystem registered`)
    }

    if (!this.#fs.readFile) {
      throw new Error(
        `Cannot load a file to DocRoot. Missing readFile implementation`,
      )
    }

    if (this.#fs.existsSync && !this.#fs.existsSync(filepath)) {
      throw new Error(`The file at path ${filepath} does not exist`)
    }

    const yml = this.#fs.readFile(filepath, 'utf8')
    if (!yml) throw new Error(`The file at ${filepath} yielded empty data`)

    let doc = this.toDocument(yml, opts?.parseOptions)
    let filename = this.#fs.getBaseName?.(filepath) ?? ''
    let key = ''

    if (coreIs.fnc(opts?.renameFile)) {
      const newFileName = opts?.renameFile(filename)
      if (coreIs.str(coreIs.str(newFileName))) filename = newFileName as string
    }

    if (coreIs.fnc(opts?.renameKey)) {
      const newKey = opts?.renameKey(filename)
      if (coreIs.str(newKey)) key = newKey
    }

    this.set(key, doc)
    return doc
  }

  use(value: DocDiagnosticsIterator | FileSystem) {
    if (is.fileSystem(value)) this.#fs = value
    else if (value instanceof DocDiagnosticsIterator) this.#iterator = value
    return this
  }
}

export default DocRoot
