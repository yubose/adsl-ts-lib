import * as is from '../utils/is'

function getAssetType(value: string | null | undefined) {
  if (typeof value !== 'string') return 'unknown'
  if (is.image(value)) {
    return 'image'
  } else if (is.script(value)) {
    return 'script'
  } else if (is.video(value)) {
    return 'video'
  } else if (is.text(value)) {
    return 'text'
  } else if (
    value.endsWith('pdf') ||
    value.endsWith('json') ||
    value.endsWith('doc')
  ) {
    return 'document'
  } else {
    return 'text'
  }
}

export default getAssetType
