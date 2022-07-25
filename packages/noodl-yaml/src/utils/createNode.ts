import y from 'yaml'
import { fp, is } from 'noodl-core'
import getYamlNodeKind from './getYamlNodeKind'
import * as c from '../constants'

function createNode<N extends Record<string, any>>(
  value: N,
): y.YAMLMap<keyof N, any>

function createNode<V extends boolean | number | string | null | undefined>(
  value: V,
): y.Scalar<V>

function createNode<K extends string, V = any>(key: K, value?: V): y.Pair<K, V>

function createNode<N extends any[]>(value: N): y.YAMLSeq<N[number]>

function createNode<N = unknown>(keyOrValue: N, value?: any) {
  switch (getYamlNodeKind(keyOrValue)) {
    case c.Kind.Scalar:
    case c.Kind.Pair:
    case c.Kind.Map:
    case c.Kind.Seq:
    case c.Kind.Document:
      return keyOrValue
    default: {
      if (is.arr(keyOrValue)) {
        const node = new y.YAMLSeq()
        keyOrValue.forEach((item) => node.add(createNode(item)))
        return node
      }

      if (arguments.length > 1 || !is.und(value)) {
        return new y.Pair(keyOrValue, value)
      }

      if (is.obj(keyOrValue)) {
        const node = new y.YAMLMap()
        fp.entries(keyOrValue).forEach(([k, v]) => node.set(k, createNode(v)))
        return node
      }

      return new y.Scalar(keyOrValue)
    }
  }
}

export default createNode
