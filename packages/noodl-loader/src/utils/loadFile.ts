import * as fs from 'fs-extra'
import {
  isAbsolute as isAbsolutePath,
  join as joinPath,
  resolve as resolvePath,
} from 'path'
import { is } from 'noodl-core'
import type { YAMLDocument } from '../internal/yaml'
import {
  parse as parseYmlToJson,
  parseDocument as parseYmlToDoc,
} from '../internal/yaml'
import * as t from '../types'

/**
 * Loads a file as a yaml string
 * @param filepath
 * @param type
 */
function loadFile(filepath: string, type?: 'yml'): string

/**
 * Loads a file as a yaml document
 * @link https://eemeli.org/yaml/#documents
 * @param filepath
 * @param type
 */
function loadFile(filepath: string, type: 'doc'): YAMLDocument

/**
 * Loads a file as json
 * @param filepath
 * @param type
 */
function loadFile(filepath: string, type: 'json'): Record<string, any>

function loadFile<T extends t.LoadType = t.LoadType>(
  filepath: string,
  type?: T,
) {
  if (is.str(filepath)) {
    if (!isAbsolutePath(filepath)) {
      filepath = resolvePath(joinPath(process.cwd(), filepath))
    }

    if (fs.existsSync(filepath)) {
      const yml = fs.readFileSync(filepath, 'utf8')

      switch (type) {
        case 'doc':
          return parseYmlToDoc(yml)
        case 'json':
          return parseYmlToJson(yml)
        default:
          return fs.readFileSync(filepath, 'utf8')
      }
    }
  }

  return ''
}

export default loadFile
