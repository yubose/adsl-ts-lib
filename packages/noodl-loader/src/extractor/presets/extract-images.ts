import { is as cis } from 'noodl-core'
import { isMap, isPair, isScalar } from '../../utils/yml'
import type { ExtractFn } from '../extractor-types'
import { ExtractType } from '../../constants'

const isImage = (v: any) =>
  typeof v === 'string' && /.(jpg|jpeg|gif|png|svg|tif|bmp|webp)$/i.test(v)

const extractImages: ExtractFn = (
  key,
  node,
  path,
  { assetsUrl = '', cadlEndpoint, createAsset, control },
) => {
  if (isMap(node) && node.has('path') && node.get('type', false) === 'image') {
    const value = (node.get('path', false) as string) || ''
    createAsset({
      type: ExtractType.Asset,
      id: value,
      props: {
        type: 'image',
        path: value,
        url: value.startsWith?.('http') ? value : `${assetsUrl}${value}`,
      },
    })
  }

  if (isScalar(node) && cis.str(node.value)) {
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
          if (isImage(node.value)) {
            const url = cadlEndpoint?.createAssetURL(node.value)
            createAsset({ type: ExtractType.Asset, id: url, props: { url } })
          }
        }
      }
    } else {
      if (key === 'value') {
        if (isImage(node.value)) {
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
          if (cis.str(pair.value.value)) {
            const value = pair.value.value
            if (isImage(value)) {
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

            if (cis.str(value)) {
              if (cis.reference(value)) {
                //
              } else if (isImage(value)) {
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
