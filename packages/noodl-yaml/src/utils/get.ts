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
  root?: Record<string, any>
  rootKey?: string
}

function get(
  node: unknown,
  key: (number | string)[] | y.Scalar | number | string,
  arg3?: boolean | GetOptions,
): any {
  // let keepScalar = true
  let originalKey = key
  let options = {} as GetOptions
  // let root
  let rootKey = ''

  if (coreIs.obj(arg3)) {
    // if (arg3.root) root = arg3.root
    if (arg3.rootKey) rootKey = arg3.rootKey
  } else if (coreIs.bool(arg3)) {
    // keepScalar = arg3 as boolean
  }

  if (y.isScalar(key) && coreIs.str(key.value)) {
    key = key.value
  }

  if (coreIs.str(key)) {
    if (coreIs.reference(key)) {
      const { paths, isLocalRef } = getRefProps(key)
      const isRootKey = !isLocalRef
      const isSameRootKey = paths[0] === rootKey

      // Update the root key to support recursive lookups
      if (isRootKey && !isSameRootKey) {
        rootKey = paths[0] as string
        key = `${rootKey}.${key}`
      }
    } else {
      //
    }
  }

  key = toPath(trimReference(key as string))

  if (node instanceof Map) {
    const nextKey = key.shift()
    const nextValue = node.get(nextKey)
    if (key.length) return get(nextValue, key, options)
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
