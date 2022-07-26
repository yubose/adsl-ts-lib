import * as u from '@jsmanifest/utils'
import Extractor from '../Extractor'
import { getScalars, isScalar } from '../../utils/yml'
import type { ExtractedItem } from '../extractorTypes'
import type { NoodlYAMLNode } from '../../types'
import * as c from '../../constants'
import * as is from '../../utils/is'

class ExtractScript extends Extractor {
  is(node: NoodlYAMLNode) {
    return isScalar(node) && u.isStr(node.value) && is.script(node.value)
  }

  extract(node: unknown): ExtractedItem[] {
    return getScalars(node).reduce((acc, scalar) => {
      if (u.isStr(scalar.value) && is.script(scalar.value)) {
        acc.push({ type: c.Asset.Script, value: scalar.value })
      }
      return acc
    }, [] as ExtractedItem[])
  }
}

export default ExtractScript
