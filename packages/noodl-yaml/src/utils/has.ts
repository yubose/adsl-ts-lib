import y from 'yaml'
import type { YAMLMap } from 'yaml'
import { fp, is as coreIs } from 'noodl-core'
import is from './is'
import unwrap from './unwrap'

function has(node: any, key: string | (string | number)[]) {
  if (y.isCollection(node)) {
    return node.hasIn(fp.toPath(key))
  }

  if (is.pairNode(node)) {
    return String(node.key) === key
  }

  return false
}

export function hasKeyStartsWith<N extends YAMLMap>(node: N, key: string) {
  return node.items.some((pair) => {
    const pairKey = unwrap(pair.key)
    return coreIs.str(pairKey) && pairKey.startsWith(key)
  })
}

export default has
