import y from 'yaml'
import type DocRoot from '../DocRoot'
import { _symbol } from '../constants'

/**
 * Unwraps a Scalar node if given a Scalar
 * @param node Scalar or value
 * @returns The unwrapped scalar or value
 */

function unwrap<N extends y.Document>(node: N): N['contents']
function unwrap<N extends y.Scalar>(node: N): N['value']
function unwrap<R extends DocRoot>(root: R): R['value']
function unwrap<V = unknown>(root: V): V
function unwrap(node: unknown) {
  if (node !== null && typeof node === 'object') {
    if (y.isScalar(node)) return node.value
    if (y.isDocument(node)) return node.contents
    if (node['_id_'] === _symbol.root) {
      return (node as DocRoot).value
    }
  }
  return node
}

export default unwrap
