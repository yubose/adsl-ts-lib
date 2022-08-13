import y from 'yaml'
import * as is from '../../utils/is'
import type { ExtractFn } from '../extractorTypes'
import { ExtractType } from '../../constants'

const extractScripts: ExtractFn = (
  key,
  node,
  path,
  { cadlEndpoint, createAsset },
) => {
  if (y.isScalar(node)) {
    if (typeof node.value === 'string') {
      if (is.script(node.value)) {
        const url = node.value.startsWith('http')
          ? node.value
          : `${cadlEndpoint?.assetsUrl}${node.value}`

        createAsset({
          type: ExtractType.Asset,
          id: url,
          props: { url, value: node.value },
        })
      }
    }
  }
  if (y.isMap(node) && node.has('path')) {
    const type = node.get('type', false)

    if (typeof type === 'string') {
      if (/plugin/i.test(type)) {
        //
      }
    }
  }
}

export default extractScripts
