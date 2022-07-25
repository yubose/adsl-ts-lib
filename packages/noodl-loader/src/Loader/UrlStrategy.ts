import path from 'path'
import y from 'yaml'
import Strategy from './Strategy'
import { fetchYml } from '../utils/yml'
import { url as isURL } from '../utils/is'
import * as t from '../types'

class UrlStrategy extends Strategy implements t.LoaderStrategy {
  constructor() {
    super()
  }

  format(value: any, options: Parameters<t.LoaderStrategy['format']>[1]) {
    //
  }

  is(value: unknown) {
    return isURL(value)
  }

  async load(...[value, { config }]: Parameters<t.ALoaderStrategy['load']>) {
    if (typeof value !== 'string') {
      value = String(value)
    }

    let url = new URL(value as string)
    let { name } = path.parse(url.href)

    let _config = ''
    let _cadlEndpoint = ''

    if (name.endsWith('_en')) name = name.substring(0, name.length - 3)

    if (url.pathname.endsWith('.yml')) {
      let { appKey, configKey } = config

      if (configKey && configKey === name) {
        _config = await fetchYml(url.href)
      } else {
        //
      }

      if (appKey?.includes(name)) {
        _cadlEndpoint = await fetchYml(url.href)
      } else {
        //
      }
    }

    return {
      config: _config,
      cadlEndpoint: _cadlEndpoint,
    }
  }
}

export default UrlStrategy
