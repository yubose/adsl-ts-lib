import type { ARoot } from '../types'

function _replace<N extends ARoot>(node: N, key: string, value: any): N

function _replace<N = any>(
  node: N,
  keyOrIndexOrValue: any,
  value?: any,
): N | null {
  // if (is.scalarNode(node)) {
  //   node.value = value
  // } else if (is.pairNode(node)) {
  //   node.value = value
  // } else if (is.mapNode(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // } else if (is.seqNode(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // } else if (is.root(node)) {
  //   node.set(keyOrIndexOrValue, value)
  // }
  return node
}

export default _replace
