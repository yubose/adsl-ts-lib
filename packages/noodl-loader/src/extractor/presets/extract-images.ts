import y from 'yaml'
import type { ExtractFn } from '../extractor-types'
import { ExtractType } from '../../constants'

const extractAssets: ExtractFn = (
  key,
  node,
  path,
  { assetsUrl = '', createAsset },
) => {
  if (
    y.isMap(node) &&
    node.has('path') &&
    node.get('type', false) === 'image'
  ) {
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
}

export default extractAssets
