import y from 'yaml'
import { fp, is } from 'noodl-core'
import getYamlNodeKind from './getYamlNodeKind'
import {
  isAnyNode,
  isScalar,
  isPair,
  isCollection,
  isMap,
  isSeq,
  isDoc,
  isNode,
} from './yaml'
import * as c from '../constants'

function createNode<N extends Record<string, any>>(
  value: N,
): y.YAMLMap<keyof N, any>

function createNode<V extends boolean | number | string | null | undefined>(
  value: V,
): y.Scalar<V>

function createNode<K extends string, V = any>(key: K, value?: V): y.Pair<K, V>

function createNode<N extends any[]>(value: N): y.YAMLSeq<N[number]>

function createNode(value: unknown): y.Node

function createNode<N = unknown>(keyOrValue: N, value?: any) {
  if (isScalar(keyOrValue)) {
    return keyOrValue
  }

  if (isPair(keyOrValue)) {
    if (!isAnyNode(keyOrValue.value)) {
      keyOrValue.value = createNode(keyOrValue.value as any)
    }
    return keyOrValue
  }

  if (isDoc(keyOrValue)) {
    if (keyOrValue.contents) {
      keyOrValue.contents = createNode(keyOrValue.contents)
    }
    return keyOrValue
  }

  if (isMap(keyOrValue)) {
    keyOrValue.items.forEach((pair) => {
      if (!isAnyNode(pair.value)) {
        pair.value = createNode(pair.value)
      }
    })
    return keyOrValue
  }

  if (isSeq(keyOrValue)) {
    keyOrValue.items.forEach((item, index) => {
      keyOrValue.set(index, createNode(item as any))
    })
    return keyOrValue
  }

  if (is.arr(keyOrValue)) {
    const node = new y.YAMLSeq()
    keyOrValue.forEach((item) => node.add(createNode(item)))
    return node
  }

  if (arguments.length === 2 || !is.und(value)) {
    return new y.Pair(keyOrValue, value)
  }

  if (is.obj(keyOrValue)) {
    const node = new y.YAMLMap()
    fp.entries(keyOrValue).forEach(([k, v]) => node.set(k, createNode(v)))
    return node
  }

  return new y.Scalar(keyOrValue)
}

export default createNode
