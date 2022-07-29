import y from 'yaml'
import type { ExtractFn } from '../extractorTypes'

const extractVideos: ExtractFn = (
  key,
  node,
  path,
  { cadlEndpoint, createAsset, state },
) => {
  if (y.isMap(node)) {
    if (node.has('path')) {
      const type = node.get('type', false) as string

      if (type === 'video') {
        const value = node.get('path', false) as string
        const url = `${cadlEndpoint?.assetsUrl}${value}`
        const assetId = url

        if (!state.assetIds.includes(assetId)) {
          createAsset({
            type: 'asset',
            id: assetId,
            props: { type, path: value, url },
          })
        }
      }
    }
  }
}

export default extractVideos
