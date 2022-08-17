import { fp, is as coreIs } from 'noodl-core'
import type { LiteralUnion } from 'type-fest'
import axios from 'axios'
import y, { isPair } from 'yaml'
import type { ToStringOptions } from 'yaml'
import * as t from '../types'

export {
  isMap,
  isSeq,
  isScalar,
  isPair,
  isCollection,
  isDocument,
  visit,
} from 'yaml'

export function ensureYmlExt(value: string) {
  if (!value.endsWith('.yml')) return `${value}.yml`
  return value
}

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
    const yml = (await axios.get(url)).data
    return isJson ? y.parse(yml) : isDoc ? toDocument(yml) : yml
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export function getNodeTypeLabel(node: unknown) {
  if (y.isScalar(node)) return 'Scalar'
  if (y.isPair(node)) return 'Scalar'
  if (y.isMap(node)) return 'YAMLMap'
  if (y.isSeq(node)) return 'YAMLSeq'
  if (y.isNode(node)) return 'Node'
  return 'unknown'
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
  } else if (coreIs.obj(node)) {
    if (y.isDocument(value) && y.isMap(value.contents)) {
      value = value.contents
    }
    if (y.isMap(value)) {
      value.items.forEach((pair) => (node[String(pair.key)] = pair.value))
    }
  }
  return node
}

export function parse<DataType extends 'map' | 'object'>(
  dataType: DataType,
  yml = '',
  opts?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions,
): DataType extends 'map' ? y.Document.Parsed : Record<string, any> {
  const options = {
    logLevel: 'debug',
    prettyErrors: true,
    strict: false,
    toStringDefaults: {
      indent: 2,
      singleQuote: true,
    },
    ...opts,
  } as typeof opts

  return dataType === 'map'
    ? y.parseDocument(yml, options)
    : y.parse(yml, options)
}

export function parseAs(value: unknown): string
export function parseAs<As extends t.As>(as: As, value: unknown): t.ParsedAs<As>
export function parseAs<As extends t.As>(
  arg1: As | unknown,
  arg2?: any,
): t.ParsedAs<As> {
  let as = 'yml' as t.As
  let value: any

  if (arg2 != undefined) {
    as = arg1 as As
    value = arg2
  } else {
    value = arg1
  }

  if (Buffer.isBuffer(value)) {
    value = value.toString('utf8')
  }

  switch (as) {
    case 'doc':
      return toDocument(value) as t.ParsedAs<As>
    case 'json':
      return y.parse(coreIs.str(value) ? value : stringify(value))
    default:
      return (coreIs.str(value) ? value : stringify(value)) as t.ParsedAs<As>
  }
}

export const toDoc = (value: unknown) => parseAs('doc', value)
export const toJson = (value: unknown) => parseAs('json', value)
export const toYml = (value: unknown) => parseAs('yml', value)

export function getScalars(
  node: unknown,
  fn: (...args: Parameters<y.visitorFn<any>>) => boolean = (_, node) =>
    y.isScalar(node),
): y.Scalar[] {
  const scalars = [] as y.Scalar[]

  if (y.isNode(node) || y.isDocument(node)) {
    y.visit(node, function onVisitNode(key, n, path) {
      const scalar = fn(key, n, path)
      if (scalar) scalars.push(n as y.Scalar)
    })
  } else if (y.isPair(node)) {
    return scalars.concat(getScalars(node.value, fn))
  }

  return scalars
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
  let options = {} as y.DocumentOptions &
    y.SchemaOptions &
    y.ParseOptions &
    y.CreateNodeOptions &
    y.ToStringOptions

  options.collectionStyle = 'block'
  options.indent = 2
  options.logLevel = 'debug'
  options.prettyErrors = true

  if (value) {
    if (y.isDocument(value)) {
      if (value.errors.length) {
        result = y.stringify(value.errors, options)
      } else {
        result = value.toString(options)
      }
    } else {
      result = y.stringify(value, options)
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
  if (value != undefined) {
    return y.parseDocument(
      typeof value === 'string' ? value : y.stringify(value),
      opts,
    )
  }
  return new y.Document(value, opts)
}

export function toNode<S extends string>(
  value: Record<LiteralUnion<S, string>, any>,
): y.YAMLMap<S>

export function toNode<V extends null | undefined | string | boolean | number>(
  value: V,
): y.Scalar<V>

export function toNode<S extends string>(value: y.YAMLMap): y.YAMLMap<S>

export function toNode<O = any>(value: O[]): y.YAMLSeq<O>

export function toNode<O extends y.Node>(value: O[]): t.YAMLNode

export function toNode(value: unknown) {
  if (isNode(value) || isPair(value)) return value

  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return new y.Scalar(value)
    default: {
      if (value === null) {
        return new y.Scalar(null)
      }
      if (coreIs.arr(value)) {
        const seq = new y.YAMLSeq()
        value.forEach((v) => seq.items.push(toNode(v)))
        return seq
      } else if (coreIs.obj(value)) {
        const map = new y.YAMLMap()
        fp.entries(value).forEach(([k, v]) => map.set(k, toNode(v)))
        return map
      }

      return value
    }
  }
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
