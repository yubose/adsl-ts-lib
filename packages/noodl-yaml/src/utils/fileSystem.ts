import type fs from 'fs'
import type { ParsedPath } from 'path'
import y from 'yaml'
import { _symbol } from '../constants'

export type FileSystem = Exclude<IFileSystem, typeof fs> &
  ReturnType<typeof createFileSystem>

export interface IFileSystem {
  existsSync: (filepath: string) => boolean
  getBaseName: (str: string) => string
  isAbsolute: (str: string) => boolean
  parseFilePath: (str: string) => ParsedPath
  readFile?: (filepath: string, encoding?: string) => string
  readYml?: (filepath: string) => string
  writeFile?: (filepath: string, data: any) => void
  readJson?: (filepath: string) => any
  writeJson?: (filepath: string) => void
  readdir?: (dir: string) => string[]
}

function createFileSystem<R = any>(
  this: any,
  getFsModule: () => IFileSystem & typeof fs,
): IFileSystem & R extends infer P ? P : any

function createFileSystem<R = any>(
  this: any,
  bindings: IFileSystem,
): IFileSystem

function createFileSystem(
  this: any,
  bindings: IFileSystem | (() => IFileSystem & typeof fs),
) {
  if (typeof bindings === 'function') {
    const fs = bindings()
    return createFileSystem.call(this, {
      ...fs,
      readFile: fs.readFileSync as IFileSystem['readFile'],
      readdir: fs.readdirSync,
      writeFile: fs.writeFileSync,
    })
  }

  let existsSync = bindings?.existsSync
  let isAbsolute = bindings?.isAbsolute
  let readFile = bindings?.readFile
  let writeFile = bindings?.writeFile
  let readJson = bindings?.readJson
  let writeJson = bindings?.writeJson
  let readdir = bindings?.readdir
  let parseFilePath = bindings?.parseFilePath

  function isFilepath(s: string) {
    return (
      s.startsWith('file:') ||
      s.startsWith('/') ||
      (/^[a-zA-Z]{1,3}:\//i.test(s) &&
        !s.startsWith('http') &&
        !s.startsWith('ws:')) ||
      isAbsolute(s)
    )
  }

  function getFileName(filepath: string) {
    if (!parseFilePath) {
      filepath = filepath.includes('/')
        ? filepath.substring(filepath.lastIndexOf('/') + 1)
        : filepath
    } else {
      const parsed = parseFilePath(filepath)
      filepath = parsed.base
    }
    return filepath
  }

  function readAst(filepathOrYml: string) {
    if (isFilepath(filepathOrYml)) {
      if (!readFile) {
        throw new Error(`Cannot load yml AST without a readFile implementation`)
      }
      return y.parseDocument(readFile?.(filepathOrYml, 'utf8'), {
        logLevel: 'debug',
        keepSourceTokens: true,
        prettyErrors: true,
      })
    }
    return y.parseDocument(filepathOrYml, {
      logLevel: 'debug',
      keepSourceTokens: true,
      prettyErrors: true,
    })
  }

  function readCst(filepathOrYml: string) {
    const parser = new y.Parser()
    if (isFilepath(filepathOrYml)) {
      if (!readFile) {
        throw new Error(`Cannot load yml AST without a readFile implementation`)
      }
      return parser.parse(readFile?.(filepathOrYml, 'utf8'))
    }
    return parser.parse(filepathOrYml)
  }

  function readFileSync(filepath: string, encoding?: string) {
    return readFile?.(filepath, encoding || 'utf8')
  }

  const o = {
    existsSync,
    getFileName,
    isFilepath,
    readFile: readFileSync,
    writeFile,
    readJson,
    writeJson,
    readdir,
    readAst,
    readCst,
  }

  Object.defineProperty(o, '_id_', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: _symbol.fs,
  })

  return o
}

export default createFileSystem
