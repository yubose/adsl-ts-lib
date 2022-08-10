/**
 * @deprecated
 */

import fg from 'fast-glob'
import fs from 'fs-extra'
import { parse as parsePath } from 'path'
import { is } from 'noodl-core'
import loadFile from './load-file'
import * as t from '../types'

export interface LoadFilesOptions extends fg.Options {
  as?: t.As
}

async function loadFiles(
  fileSystem: Partial<typeof fs>,
  glob: string,
  options?: LoadFilesOptions,
): Promise<any>

async function loadFiles<As extends t.As = t.As>(
  glob: string,
  options?: LoadFilesOptions,
): Promise<any>

/**
 * Load files from dir and optionally provide a second argument as an options
 * object
 *
 * Supported options:
 *
 * - as: "list" to receive the result as an array, "map" as a Map, and "object"
 * 		as an object. Defaults to "list"
 * - onFile: A callback function to call when a filepath is being inserted to
 * 		the result
 * - type: Return each data in the from of "doc", "json", or "yml" (Defaults to
 * 		"yml")
 */

/**
 * @param arg1
 * @param arg2
 */
async function loadFiles(
  arg1: string | Partial<typeof fs>,
  arg2?: string | fg.Options,
  arg3?: LoadFilesOptions,
) {
  let _fsys: typeof fs | undefined
  let _options: LoadFilesOptions | undefined
  let _glob = ''

  if (is.obj(arg1)) {
    _fsys = arg1 as typeof fs
    _glob = arg2 as string
    _options = arg3
  } else if (is.str(arg1)) {
    _fsys = fs
    _glob = arg1
    _options = arg2 as LoadFilesOptions | undefined
  }

  try {
    const { as, ...fgOptions } = _options || {}

    console.log({ _glob })

    const entryMatches = await fg(_glob, {
      fs: _fsys,
      ...fgOptions,
      objectMode: true,
    })

    const files = {} as Record<
      string,
      {
        dir: string
        ext: string
        filename: string
        filepath: string
        name: string
        data: any
      }
    >

    await Promise.all(
      entryMatches.map(async (entry) => {
        try {
          const { dir, ext, name } = parsePath(entry.path)

          files[entry.path] = {
            dir,
            ext,
            filename: entry.name,
            filepath: entry.path,
            name,
            data: await loadFile(_fsys as any, entry.path, as),
          }
        } catch (error) {
          throw error instanceof Error ? error : new Error(String(error))
        }
      }),
    )

    return files
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default loadFiles
