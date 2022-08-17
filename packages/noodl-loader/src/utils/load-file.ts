import type { LiteralUnion } from 'type-fest'
import * as fs from 'fs-extra'
import {
  isAbsolute as isAbsolutePath,
  join as joinPath,
  resolve as resolvePath,
} from 'path'
import { is } from 'noodl-core'
import { parseAs } from './yml'
import type FileSystemHost from '../file-system'
import * as t from '../types'

/**
 * Loads a file as a yaml string, object literal, or yaml document
 * @param filepath
 * @param as
 */
function loadFile<As extends t.As = 'yml'>(
  filepath: string,
  as?: As,
): Promise<t.ParsedAs<As>>

/**
 * Loads a file as a yaml string, object literal, or yaml document using a custom fileSystem api
 * @param filepath
 * @param as
 */
function loadFile<As extends t.As>(
  fileSystem: FileSystemHost,
  filepath: string,
  as?: As,
): Promise<t.ParsedAs<As>>

/**
 * Loads a file as a yaml string, object literal, or yaml document
 * @param arg1
 * @param arg2
 * @param arg3
 */
async function loadFile<As extends t.As = t.As>(
  arg1: string | FileSystemHost,
  arg2?: string,
  arg3?: LiteralUnion<As, string>,
) {
  let _filepath = ''
  let _fsys: typeof fs | undefined
  let _as = 'yml' as t.As

  if (is.str(arg1)) {
    if (!isAbsolutePath(arg1)) {
      arg1 = resolvePath(joinPath(process.cwd(), arg1))
    }

    if (fs.existsSync(arg1)) {
      _filepath = arg1

      if (arg2 === 'doc') {
        _as = 'doc'
      } else if (arg2 === 'json') {
        _as = 'json'
      }
    } else {
      throw new Error(`The file at "${arg1}" does not exist`)
    }
  } else if (is.obj(arg1)) {
    _fsys = arg1 as typeof fs
    _filepath = arg2 || ''
    _as = (arg3 || 'yml') as t.As
  }

  let yml = ''

  try {
    yml = (await _fsys?.readFile(_filepath, 'utf8')) || ''
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }

  return parseAs(_as, yml)
}

export default loadFile
