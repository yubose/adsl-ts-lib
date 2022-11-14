import y from 'yaml'
import { fp, is as coreIs } from 'noodl-core'
import createNode from './createNode'
import is from './is'
import getYamlNodeKind from './getYamlNodeKind'
import unwrap from './unwrap'
import { Kind } from '../constants'

function getEmptyValue(path: string | number | (string | number)[]): any {
  if (path !== undefined) path = fp.toPath(path)
  const value = path[0]
  if (coreIs.index(value)) return []
  return {}
}

function set(node: y.YAMLMap, key: y.Scalar, value: any): void
function set(node: y.YAMLSeq, index: number | null, value: any): void
function set(obj: Record<string, any>, key: number | string, value: any): void
function set(arr: any[], index: number, value: any): void

function set(node: y.Scalar, value: any): void
function set(node: y.Pair, value: any): void

function set(...[arg1, arg2, arg3, arg4]: unknown[]) {
  let node: unknown
  let key: number[] | string[] | y.Scalar | number | string | undefined
  let value: any
  let deep = false

  if (arguments.length === 3) {
    node = arg1
    key = arg2 as any
    value = arg3
  } else if (arguments.length === 2) {
    node = arg1
    value = arg2
  }

  if (y.isScalar(node)) {
    node.value = value
  } else if (y.isPair(node)) {
    node.value = createNode(value)
  } else if (y.isCollection(node)) {
    if (coreIs.str(key)) {
      key = fp.toPath(key)
    }

    if (coreIs.arr(key)) {
      while (key.length) {
        const nextKey = key.shift()
        const nextValue = key.length >= 1 ? getEmptyValue(key) : value
        const nextNode = createNode(nextValue)

        if (y.isCollection(node)) {
          node.set(nextKey, nextNode)
        } else if (y.isPair(node)) {
          node.value = nextNode
        } else if (y.isScalar(node)) {
          node.value = nextValue
        }

        node = nextNode
      }
    } else if (coreIs.index(key)) {
      node.set(key, createNode(value))
    } else {
      node.setIn(key as any, createNode(value))
    }
  } else if (node instanceof Map) {
    node.set(key, createNode(value))
  } else if (coreIs.arr(node)) {
    //
  } else if (coreIs.obj(node)) {
    //
  } else {
    if (is.ymlNode(node)) {
      switch (getYamlNodeKind(node)) {
        case Kind.Seq:
        case Kind.Map:
        case Kind.Document: {
          const setFn = deep ? 'setIn' : 'set'
          const setPath = deep ? fp.path(unwrap(key) as string) : key
          return void (node as y.Document | y.YAMLMap | y.YAMLSeq)[setFn](
            setPath as string,
            createNode(value),
          )
        }
        case Kind.Pair: {
          return void ((node as y.Pair).value = createNode(value))
        }
        case Kind.Scalar: {
          return void ((node as y.Scalar).value = value)
        }
      }
    } else if (coreIs.obj(node)) {
      //
    }
  }
}

export default set
