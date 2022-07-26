import * as u from '@jsmanifest/utils'
import Extractor from '../Extractor'
import { getScalars, isScalar } from '../../utils/yml'
import type { ExtractedItem } from '../extractorTypes'
import type { NoodlYAMLNode } from '../../types'
import * as c from '../../constants'
import * as is from '../../utils/is'

class ExtractImage extends Extractor {
  is(node: NoodlYAMLNode) {
    return isScalar(node) && u.isStr(node.value) && is.image(node.value)
  }

  extract({ assets, key, node, path }): ExtractedItem[] {
    const results = [] as ExtractedItem[]

    for (const scalar of getScalars(node)) {
      if (u.isStr(scalar.value) && is.image(scalar.value)) {
        if (!ids.includes(scalar.value)) {
          results.push({ type: c.Asset.Image, value: scalar.value })
          ids.push(scalar.value)
        }
      }
    }

    return results
  }
}

export default ExtractImage
