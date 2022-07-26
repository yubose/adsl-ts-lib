import * as u from '@jsmanifest/utils'
import Extractor from '../Extractor'
import {
  isNode,
  isDocument,
  isMap,
  isScalar,
  isSeq,
  isPair,
  visit,
  unwrap,
} from '../../utils/yml'
import type { ExtractedItem } from '../extractorTypes'
import type { NoodlYAMLNode } from '../../types'
import * as is from '../../utils/is'
import * as c from '../../constants'

class ExtractYaml extends Extractor {
  extract(node: unknown): ExtractedItem[] {
    const results = [] as ExtractedItem[]

    const add = (value: string) => results.push({ type: c.Asset.Yaml, value })

    if (isDocument(node)) node = node.contents
    if (isPair(node)) node = node.value

    if ((isNode(node) || isDocument(node)) && !isPair(node)) {
      visit(node, (key, n) => {
        if (isScalar(n)) {
          if (u.isStr(n.value)) {
            if (n.value.endsWith('.yml')) add(n.value)
          }
        } else if (isMap(n)) {
          if (n.has('cadlMain')) {
            const cadlMain = n.get('cadlMain')
            if (is.yaml(cadlMain)) add(cadlMain)
          }

          if (n.has('path')) {
            const path = n.get('path')
            if (is.yaml(path)) add(path)
          }

          for (const key of ['preload', 'page']) {
            if (n.has(key)) {
              const value = n.get(key)
              if (isSeq(value)) {
                value.items.forEach((item) => {
                  if (isScalar(item) && is.yaml(item.value)) add(item.value)
                })
              }
            }
          }
        }
      })
    }

    return results
  }
}

export default ExtractYaml
