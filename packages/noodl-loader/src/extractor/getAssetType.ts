import * as is from '../utils/is'
import { AssetType } from '../constants'

function getAssetType(value: string | null | undefined) {
  if (typeof value !== 'string') return AssetType.Unknown
  if (is.image(value)) {
    return AssetType.Image
  } else if (is.script(value)) {
    return AssetType.Script
  } else if (is.video(value)) {
    return AssetType.Video
  } else if (is.text(value)) {
    return AssetType.Text
  } else if (
    value.endsWith('pdf') ||
    value.endsWith('json') ||
    value.endsWith('doc')
  ) {
    return AssetType.Document
  } else {
    return AssetType.Text
  }
}

export default getAssetType
