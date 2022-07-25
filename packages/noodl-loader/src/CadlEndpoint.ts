import type { AppConfig } from 'noodl-core'
import type { LiteralUnion } from 'type-fest'
import y from 'yaml'
import type NoodlConfig from './Config'
import { stringify } from './utils/yml'
import * as t from './types'

class NoodlCadlEndpoint {
  assetsUrl = ''
  baseUrl = ''
  config: NoodlConfig | null = null
  fileSuffix: LiteralUnion<'.yml', string> = '.yml'
  languageSuffix = new y.YAMLMap<'en_US' | 'zh_CH'>()
  preload: string[] = []
  pages: string[] = []
  startPage = ''

  build() {
    return stringify(this.toJSON())
  }

  toJSON() {
    return {
      baseUrl: `\${cadlBaseUrl}`,
      assetsUrl: `\${cadlBaseUrl}assets/`,
      languageSuffix: {
        zh_CN: '_cn',
        es_ES: '_es',
        unknown: '_en',
      },
      fileSuffix: this.fileSuffix,
      startPage: this.startPage,
      preload: this.preload,
      pages: this.pages,
    }
  }
}

export default NoodlCadlEndpoint
