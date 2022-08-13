import y from 'yaml'
import * as is from '../../utils/is'
import type { ExtractFn } from '../extractorTypes'
import { ExtractType } from '../../constants'

const extractDocuments: ExtractFn = (
  key,
  node,
  path,
  { cadlEndpoint, createAsset },
) => {
  if (y.isScalar(node)) {
    if (typeof node.value === 'string') {
      if (is.json(node.value) || is.pdf(node.value)) {
        const value = node.value
        const url = value.startsWith('http')
          ? value
          : `${cadlEndpoint?.assetsUrl}${value}`
        const assetId = url

        createAsset({
          type: ExtractType.Asset,
          id: assetId,
          props: { url, value },
        })
      }
    }
  }
}

export default extractDocuments
