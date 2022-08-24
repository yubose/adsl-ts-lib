import { fp, is as coreIs } from 'noodl-core'
import { isMap, isPair, isScalar } from '../../utils/yml'
import type { ExtractFn } from '../extractor-types'
import { ExtractType } from '../../constants'

const extractImages: ExtractFn = (
  key,
  node,
  path,
  { assetsUrl = '', cadlEndpoint, createAsset, control },
) => {
  if (isScalar(node) && coreIs.str(node.value)) {
    let pathLength = path.length
    let prevNode: any

    if (pathLength > 0) {
      prevNode = path[pathLength - 1]
    } else {
      //
    }

    if (isPair(prevNode)) {
      const pairKey = String(prevNode.key)

      if (pairKey === 'path') {
        if (key === 'value') {
          const url = cadlEndpoint?.createAssetURL(node.value)
          createAsset({ type: ExtractType.Asset, id: url, props: { url } })
        }
      } else {
        if (key === 'value') {
          if (coreIs.image(node.value)) {
            const url = cadlEndpoint?.createAssetURL(node.value)
            createAsset({ type: ExtractType.Asset, id: url, props: { url } })
          }
        }
      }
    } else {
      if (key === 'value') {
        if (coreIs.image(node.value)) {
          const url = cadlEndpoint?.createAssetURL(node.value)
          createAsset({ type: ExtractType.Asset, id: url, props: { url } })
        }
      }
    }
  } else if (isMap(node)) {
    for (const pair of node.items) {
      const pairKey = String(pair.key)

      if (pairKey === 'path') {
        if (isScalar(pair.value)) {
          if (coreIs.str(pair.value.value)) {
            const value = pair.value.value
            if (coreIs.image(value)) {
              const url = cadlEndpoint?.createAssetURL(value)
              createAsset({ type: ExtractType.Asset, id: url, props: { url } })
            }
          }
        } else if (isMap(pair.value)) {
          // Emit/if
        }
      } else {
        if (isScalar(pair.value)) {
          if (key === 'value') {
            const value = pair.value.value

            if (coreIs.str(value)) {
              if (coreIs.reference(value)) {
                //
              } else if (coreIs.image(value)) {
                const url = cadlEndpoint?.createAssetURL(value)
                createAsset({
                  type: ExtractType.Asset,
                  id: url,
                  props: { url },
                })
              }
            }
          }
        }
      }
    }
  }
}

export default extractImages
