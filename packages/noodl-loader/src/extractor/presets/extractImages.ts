import y from 'yaml'
import type { ExtractFn } from '../extractorTypes'

const extractAssets: ExtractFn = (key, node, path, { createAsset, state }) => {
  if (
    y.isMap(node) &&
    node.has('path') &&
    node.get('type', false) === 'image'
  ) {
    const value = node.get('path', false) as string
    if (!state.assetIds.includes(value)) {
      createAsset({
        type: 'asset',
        id: value,
        props: { type: 'image', path: value },
      })
    }
  }
}

export default extractAssets
