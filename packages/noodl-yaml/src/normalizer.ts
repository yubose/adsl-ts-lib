import * as u from '@jsmanifest/utils'
import y from 'yaml'
import {
  isScalar,
  isPair,
  isCollection,
  isMap,
  isSeq,
  isNode,
  isDoc,
} from './utils/yaml'
import createNode from './utils/createNode'
import { fp } from 'noodl-core'
import { normalizeProps } from 'noodl-ui'

export function createNormalizer(options) {
  return (node: any) => {
    if (isMap(node)) {
      node = node.toJSON()
    }
    const result = normalizeProps(new y.YAMLMap(), node, options)

    return result
  }
}
