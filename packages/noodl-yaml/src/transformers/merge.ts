import type { ReferenceString } from 'noodl-types'
import { is as coreIs } from 'noodl-core'
import y from 'yaml'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import getYamlNodeKind from '../utils/getYamlNodeKind'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import type DocRoot from '../DocRoot'
import * as c from '../constants'
import * as t from '../types'

export interface MergeOptions {
  root?: DocRoot
  rootKey?: y.Scalar<string> | string
}

function isMergingRef<S extends string>(refOrNode: S | y.Scalar<S>) {
  return (
    (is.scalarNode(refOrNode) &&
      coreIs.str(refOrNode.value) &&
      is.reference(refOrNode)) ||
    (coreIs.str(refOrNode) && refOrNode.startsWith('.'))
  )
}

function _merge<N extends t.YAMLNode>(
  node: N,
  refOrNode:
    | DocRoot
    | Record<string, any>
    | ReferenceString
    | y.Scalar<ReferenceString>
    | y.YAMLMap
    | null
    | undefined,
  { root, rootKey }: MergeOptions = {},
): N | null {
  let mergingValue: any
  let ref: string | undefined

  if (
    (coreIs.str(refOrNode) || y.isScalar(refOrNode)) &&
    isMergingRef(refOrNode)
  ) {
    ref = coreIs.str(refOrNode) ? refOrNode : refOrNode.value
  }

  if (is.nil(node)) {
    return ref ? deref({ node: ref, root, rootKey }).value : refOrNode
  }

  switch (getYamlNodeKind(node)) {
    case c.Kind.Map:
    case c.Kind.Seq:
    case c.Kind.Pair:
    case c.Kind.Scalar:
    case c.Kind.Document: {
      if (ref) {
        mergingValue = createNode(deref({ node: ref, root, rootKey }).value)
      } else {
        mergingValue = createNode(refOrNode as any)
      }

      switch (getYamlNodeKind(mergingValue)) {
        case c.Kind.Unknown:
        case c.Kind.Seq:
        case c.Kind.Pair:
        case c.Kind.Scalar: {
          if (is.seqNode(node)) {
            if (is.seqNode(mergingValue)) {
              mergingValue.items.forEach((item) =>
                node.add(createNode(item as any)),
              )
            } else if (is.pairNode(mergingValue)) {
              node.add(createNode(mergingValue.value as any))
            } else {
              node.add(createNode(mergingValue))
            }
          }
          break
        }
        case c.Kind.Map:
        case c.Kind.Document: {
          let nodeMerging: any

          if (is.mapNode(mergingValue)) {
            nodeMerging = mergingValue
          } else {
            const doc = mergingValue as y.Document
            if (is.mapNode(doc.contents)) {
              nodeMerging = doc.contents
            }
          }

          if (nodeMerging) {
            if (is.mapNode(nodeMerging)) {
              nodeMerging.items.forEach((pair) => {
                if (is.mapNode(node)) {
                  node.set(pair.key, pair.value)
                }
              })
            }
          } else {
            if (mergingValue != null) {
              if (Array.isArray(mergingValue)) {
                //
              } else if (typeof mergingValue === 'object') {
                Object.entries(mergingValue).forEach(([k, v]) =>
                  (node as y.YAMLMap).set(unwrap(k), createNode(v as any)),
                )
              }
            }
          }

          break
        }
      }

      return node
    }
    default:
      return node
  }
}

export default _merge
