import * as u from '@jsmanifest/utils'
import axios from 'axios'
import y from 'yaml'
import type { ToStringOptions } from 'yaml'
import * as t from '../types'

/**
 * Fetches a yaml file using the url provided.
 * If "as" is "json", the result will be parsed and returned as json
 *
 * @param url URL
 * @param as Return data as json or yml. Defaults to 'yml'
 * @returns { string | Record<string, any> }
 */
export async function fetchYml(
  url: string,
  as: 'doc',
): Promise<y.Document | y.Document.Parsed>
export async function fetchYml(
  url: string,
  as: 'json',
): Promise<Record<string, any>>
export async function fetchYml(url: string, as?: 'yml'): Promise<string>
export async function fetchYml(
  url: string,
  as: 'doc' | 'json' | 'yml' = 'yml',
) {
  try {
    const isJson = as === 'json'
    const isDoc = as === 'doc'
    const contentType = isJson ? 'application/json' : 'text/plain'
    const { data: yml } = await axios.get(url, {
      headers: {
        Accept: contentType,
        'Content-Type': contentType,
      },
    })
    return isJson ? y.parse(yml) : isDoc ? toDocument(yml) : yml
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export function isNode(
  value: unknown,
): value is y.Document | y.Document.Parsed | y.Node | y.Pair {
  return (
    value !== null &&
    typeof value === 'object' &&
    (y.isNode(value) || y.isPair(value) || y.isDocument(value))
  )
}

export function merge(node: unknown, value: unknown) {
  if (node instanceof Map) {
    if (y.isDocument(value) && y.isMap(value.contents)) {
      value = value.contents
    }
    if (y.isMap(value)) {
      value.items.forEach((pair) => node.set(pair.key, pair.value))
    }
  } else if (y.isMap(node)) {
    if (y.isDocument(value) && y.isMap(value.contents)) {
      value = value.contents
    }
    if (y.isMap(value)) {
      value.items.forEach((pair) => node.set(pair.key, pair.value))
    }
  } else if (y.isSeq(node)) {
    if (y.isSeq(value)) {
      value.items.forEach((item) => node.add(item))
    }
  } else if (y.isPair(node)) {
    if (y.isPair(value)) {
      node.value = value.value
    }
  } else if (y.isScalar(node)) {
    if (y.isScalar(value)) {
      node.value = value.value
    } else if (y.isPair(value)) {
      node.value = value.value
    }
  } else if (u.isObj(node)) {
    if (y.isDocument(value) && y.isMap(value.contents)) {
      value = value.contents
    }
    if (y.isMap(value)) {
      value.items.forEach((pair) => (node[String(pair.key)] = pair.value))
    }
  }
  return node
}

export function parse<DataType extends t.Loader.RootDataType>(
  dataType: DataType,
  yml = '',
  opts?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions,
): DataType extends 'map' ? y.Document.Parsed : Record<string, any> {
  return dataType === 'map' ? y.parseDocument(yml, opts) : y.parse(yml, opts)
}

/**
 * Returns the stringified output of the yaml document or object.
 * If there are errors when parsing yaml documents, it returns a stringified yaml output of the errors instead
 * @param { y.Document } doc
 */
export function stringify<O extends Record<string, any> | y.Document>(
  value: O | null | undefined,
  opts?: ToStringOptions,
) {
  let result = ''

  if (value) {
    if (y.isDocument(value)) {
      if (value.errors.length) {
        result = y.stringify(value.errors)
      } else {
        result = value.toString(opts)
      }
    } else {
      result = y.stringify(value)
    }
  }

  return result
}

/**
 * Will convert value to a yaml document
 * @param value The value to convert. Supports yaml string or an object literal
 * @returns A yaml document
 */
export function toDocument(
  value: Record<string, any> | string,
  opts?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions,
) {
  if (value) {
    return y.parseDocument(
      typeof value === 'string' ? value : y.stringify(value),
      opts,
    )
  }
  return new y.Document(value, opts)
}

export function withYmlExt(s = '') {
  return !s.endsWith('.yml') && (s += '.yml')
}

/**
 * Unwraps a Scalar node if given a Scalar
 * @param node Scalar or value
 * @returns The unwrapped scalar or value
 */

export function unwrap<N extends y.Document>(node: N): N['contents']
export function unwrap<N extends y.Scalar>(node: N): N['value']
export function unwrap<V = unknown>(root: V): V
export function unwrap(node: unknown) {
  if (node !== null && typeof node === 'object') {
    if (y.isScalar(node)) return node.value
    if (y.isDocument(node)) return node.contents
  }
  return node
}
