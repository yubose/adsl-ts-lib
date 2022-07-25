import y from 'yaml'
import { fp } from 'noodl-core'
import createNode from './createNode'
import is from './is'
import getYamlNodeKind from './getYamlNodeKind'
import unwrap from './unwrap'
import { Kind } from '../constants'

function set(
  node: unknown,
  key: number[] | string[] | y.Scalar | number | string,
  value: any,
  deep?: boolean,
) {
  if (y.isScalar(key) && typeof key.value === 'string') {
    key = key.value
  }
  if (node instanceof Map) {
    node.set(key, createNode(value))
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
    }
  }
}

export default set
