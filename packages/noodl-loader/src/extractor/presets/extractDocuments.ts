import y from 'yaml'
import * as is from '../../utils/is'
import type { ExtractFn } from '../extractorTypes'

const extractDocuments: ExtractFn = (
  key,
  node,
  path,
  { cadlEndpoint, createAsset, state },
) => {
  if (y.isScalar(node)) {
    if (typeof node.value === 'string') {
      if (is.json(node.value) || is.pdf(node.value)) {
        const value = node.value
        const url = value.startsWith('http')
          ? value
          : `${cadlEndpoint?.assetsUrl}${value}`
        const assetId = url

        if (!state.assetIds.includes(assetId)) {
          createAsset({
            type: 'asset',
            id: assetId,
            props: { url, value },
          })
        }
      }
    }
  }
}

export default extractDocuments
