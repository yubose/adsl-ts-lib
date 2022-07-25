import { join as joinPath } from 'path'
import { getFileStructure, getFileName, path } from 'noodl-file'
import fg from 'fast-glob'
import { Document as YAMLDocument, isDocument, isMap, Scalar } from 'yaml'
import { fp, is } from 'noodl-core'
import type { IFileStructure } from '../../../file/src/FileStructure'
import loadFile from './loadFile'
import * as t from '../types'

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
 * Load files into an array of strings as raw yml
 */
function loadFiles<T extends 'yml', A extends 'list'>(
  dir: string,
  opts?: t.LoadFilesOptions<T, A>,
): string[]

/**
 * Load files into an array of objects
 */
function loadFiles<T extends 'json', A extends 'list'>(
  dir: string,
  opts?: t.LoadFilesOptions<T, A>,
): Record<string, any>[]

/**
 * Load files into an array of yaml documents
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'doc', 'list'>,
): YAMLDocument[]

/**
 * Load files into an object literal where key is the name and the value is
 * their yml
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'yml', 'object'>,
): Record<string, string>

/**
 * Load files into an object literal where key is the name and the value is a
 * JS object
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'json', 'object'>,
): Record<string, any>

/**
 * Load files into an object literal where key is the name and the value is a
 * yaml node
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'doc', 'object'>,
): Record<string, YAMLDocument>

/**
 * Load files into a Map where key is the name and value is their yml
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'yml', 'map'>,
): Map<string, string>

/**
 * Load files into a Map where key is the name and value is a JS object
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'json', 'map'>,
): Map<string, any>

/**
 * Load files into a Map where key is the name and value is a yaml node
 */
function loadFiles(
  dir: string,
  opts?: t.LoadFilesOptions<'doc', 'map'>,
): Map<string, YAMLDocument>

/**
 * Load files from dir and optionally a second argument as 'yml' (default) for an array of yml data
 */
function loadFiles(dir: string, type?: 'yml' | undefined): string[]

/**
 * Load files from dir and optionally a second argument as 'json' to receive
 * an array of objects
 */
function loadFiles(dir: string, type: 'json'): Record<string, any>[]

/**
 * Load files from dir and optionally a second argument as 'doc' to receive
 * an array of yaml nodes
 */
function loadFiles(dir: string, type: 'doc'): YAMLDocument[]

/**
 *
 * @param { string } args
 */
function loadFiles<
  LType extends t.LoadType = t.LoadType,
  LFType extends t.LoadFilesAs = t.LoadFilesAs,
>(dir: string, opts: t.LoadFilesOptions<LType, LFType> | t.LoadType = 'yml') {
  let ext = 'yml'
  let type = 'yml'

  if (is.str(dir)) {
    opts === 'json' && (ext = 'json')

    const glob = `**/*.${ext}`
    const _path = path.normalize(path.resolve(joinPath(dir, glob)))

    if (is.str(opts)) {
      type = opts === 'json' ? 'json' : opts === 'doc' ? 'doc' : type
      return fg
        .sync(_path, { onlyFiles: true })
        .map((filepath) => loadFile(filepath as string, type as any))
    } else if (is.obj(opts)) {
      type = opts.type ?? type
      const includeExt = opts?.includeExt
      const keysToSpread = opts.spread ? fp.toArr(opts.spread) : []

      function getKey(metadata: IFileStructure) {
        // @ts-expect-error
        return includeExt ? getFileName(metadata.filepath) : metadata.filename
      }

      function listReducer(acc: any[] = [], filepath: string) {
        return acc.concat(loadFile(filepath, type as any))
      }

      function mapReducer(acc: Map<string, any>, filepath: string) {
        const metadata = getFileStructure(filepath)
        const key = getKey(metadata)
        const data = loadFile(filepath, type as any)
        isDocument(data) && data.has(key) && (data.contents = data.get(key))
        if (keysToSpread.includes(key)) {
          if (isDocument(data) && isMap(data.contents)) {
            for (const item of data.contents.items) {
              const itemKey = item.key as Scalar<string>
              acc.set(itemKey.value, item.value)
            }
          } else if (is.obj(data)) {
            for (const [key, value] of Object.entries(data)) acc.set(key, value)
          }
        } else {
          acc.set(key, data)
        }
        return acc
      }

      function objectReducer(acc: Record<string, any>, filepath: string) {
        const metadata = getFileStructure(filepath)
        const key = getKey(metadata)
        let data = loadFile(filepath, type as any)
        is.obj(data) && key in data && (data = data[key] as any)
        if (keysToSpread.includes(key) && is.obj(data)) {
          if (isDocument(data) && isMap(data.contents)) {
            data.contents.items.forEach((pair) => {
              acc[String(pair.key)] = pair.value
            })
          } else if (is.obj(data)) {
            Object.assign(acc, data)
          }
        } else {
          acc[key] = data
        }
        return acc
      }

      const items = fg.sync(_path, { onlyFiles: true })
      if (opts.as === 'list') return items.reduce(listReducer, [])
      if (opts.as === 'map') return items.reduce(mapReducer, new Map())
      return items.reduce(objectReducer, {})
    }
  } else if (is.obj(dir)) {
    //
  }
}

export default loadFiles
