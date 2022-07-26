import y from 'yaml'
import * as is from '../utils/is'
import * as c from '../constants'
import * as t from './extractorTypes'
import type { YAMLNode } from '../types'

export function defaultExtractor(
  node: any,
  callback: ExtractCallback = (asset) => asset,
): Asset[] {
  const extract = (currentAssets: Asset[], node: unknown) => {
    if (node) {
      if (y.isMap(node)) {
        return currentAssets.concat(
          node.items.reduce((acc, pair) => {
            return acc.concat(extract(acc, extract(acc, pair)))
          }, [] as Asset[]),
        )
      } else if (y.isSeq(node)) {
        return currentAssets.concat(
          node.items.reduce((acc: Asset[], item) => {
            return acc.concat(extract(acc, item))
          }, []),
        )
      } else if (y.isPair(node)) {
        return extract(currentAssets, node.value)
      } else if (y.isDocument(node)) {
        return extract(currentAssets, node.contents)
      } else if (y.isScalar(node)) {
        if (typeof node.value === 'string') {
          const { value } = node
          if (is.url(value)) {
            const urlObject = new URL(value)
            currentAssets.push(
              callback({
                host: urlObject.host,
                path: urlObject.href,
                value,
                type: getAssetType(value),
              }),
            )
          } else {
            // Assuming it is a file path or file name
            currentAssets.push(
              callback({
                path: value,
                type: getAssetType(value),
                value,
              } as AssetFile),
            )
          }
        }
      }
    }

    return currentAssets
  }

  return extract([], node)
}

abstract class Extractor {
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {}
  }

  constructor() {
    Object.defineProperty(this, c.idKey, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: c._id.extractor,
    })
  }

  abstract is(...args: any[]): boolean

  abstract extract(options: {
    node: YAMLNode
    key: 'key' | 'value' | null
    path: (y.Document | y.Node | y.Pair)[]
  }): t.ExtractedItem[]
}

export default Extractor
