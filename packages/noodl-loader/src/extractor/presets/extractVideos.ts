import y from 'yaml'
import type { ExtractFn } from '../extractorTypes'
import { ExtractType } from '../../constants'

const extractVideos: ExtractFn = (
  key,
  node,
  path,
  { cadlEndpoint, createAsset },
) => {
  if (y.isMap(node)) {
    if (node.has('path')) {
      const type = node.get('type', false) as string

      if (type === 'video') {
        const value = node.get('path', false) as string
        const url = value.startsWith('http')
          ? value
          : `${cadlEndpoint?.assetsUrl}${value}`
        const assetId = url

        createAsset({
          type: ExtractType.Asset,
          id: assetId,
          props: { type, path: value, url },
        })
      }
    }
  }
}

export default extractVideos
