import * as u from '@jsmanifest/utils'
import {
  Document as YAMLDocument,
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq,
  isNode,
  isDocument,
  isScalar,
  isPair,
  isMap,
  isSeq,
  parse,
  parseDocument,
  visit,
} from 'yaml'
import type { Node as YAMLNode, visitor, visitorFn } from 'yaml'

export {
  Pair,
  Scalar,
  YAMLNode,
  YAMLDocument,
  YAMLMap,
  YAMLSeq,
  isNode,
  isDocument,
  isScalar,
  isPair,
  isMap,
  isSeq,
  parse,
  parseDocument,
  visit,
  visitor,
  visitorFn,
}

export function toYAML(value: any, options?: Parameters<typeof parse>[1]) {
  return parse(value, {
    logLevel: 'warn',
    schema: 'core',
    version: '1.2',
    ...options,
  })
}

export function toDocument(
  value: any,
  options?: Parameters<typeof parseDocument>[1],
) {
  return parseDocument(value, {
    logLevel: 'warn',
    schema: 'core',
    version: '1.2',
    ...options,
  })
}

export function getKeys<V = any>(value: V): string[] {
  if (u.isArr(value)) {
    return value.map((val) => {
      if (isNode(val)) {
        if (isScalar(val)) return val.toString()
      }
      return val
    })
  }
  return []
}
