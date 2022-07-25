import y from 'yaml'
import {
  is as coreIs,
  fp,
  getRefProps,
  toPath,
  trimReference,
} from 'noodl-core'
import is from './is'
import getYamlNodeKind from './getYamlNodeKind'
import { Kind } from '../constants'

export interface GetOptions {
  rootKey?: string
}

function get(
  node: unknown,
  key: (number | string)[] | y.Scalar | number | string,
  { rootKey = '' }: GetOptions = {},
) {
  let originalKey = key

  if (y.isScalar(key) && typeof key.value === 'string') {
    key = key.value
  }

  if (typeof key === 'string') {
    if (coreIs.reference(key)) {
      const { paths, isLocalRef } = getRefProps(key)

      if (!isLocalRef && paths[0] !== rootKey) {
        rootKey = paths[0]
        key = `${rootKey}.${key}`
      }

      key = trimReference(key)
    } else {
      //
    }
  }

  key = toPath(key as string)

  if (node instanceof Map) {
    const nextKey = key.shift()
    const nextValue = node.get(nextKey)
    if (key.length) return get(nextValue, key)
    return nextValue
  }

  if (is.ymlNode(node)) {
    switch (getYamlNodeKind(node)) {
      case Kind.Map: {
        const nextKey = key.shift()
        const nextValue = (node as y.YAMLMap).get(nextKey, true)
        if (key.length) {
          return get(nextValue, key)
        } else {
          // if (
          //   (is.scalarNode(nextValue) && is.reference(nextValue)) ||
          //   (coreIs.str(nextValue) && coreIs.reference(nextValue))
          // ) {
          //   // Reference within a reference
          //   const ref = is.scalarNode(nextValue) ? nextValue.value : nextValue
          //   const refPath = trimReference(ref)
          //   if (coreIs.rootReference(ref)) {
          //     const refPaths = refPath.split('.')
          //     if (refPaths[0] !== rootKey) {
          //       rootKey = refPaths.shift() as string
          //       return get(ref, refPaths, { rootKey })
          //     }
          //   }
          // }
        }
        return nextValue
      }
      case Kind.Seq: {
        const nextKey = key.shift()
        const nextValue = (node as y.YAMLSeq).get(nextKey)
        return key.length ? get(nextValue, key) : nextValue
      }
      case Kind.Document: {
        return key.length ? get((node as y.Document).contents, key) : undefined
      }
    }
  }

  if (is.root(node)) {
    return get(node.value, key)
  }

  return key.length
    ? fp.get(node as any, key)
    : key === originalKey
    ? undefined
    : node
}

export default get
