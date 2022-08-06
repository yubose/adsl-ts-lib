import type { LiteralUnion } from 'type-fest'
import y from 'yaml'
import type NoodlConfig from './config'
import { stringify } from './utils/yml'

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

  preloadExists(value: string) {
    if (value.endsWith('_en')) value = value.substring(0, value.length - 3)
    if (value.endsWith('.yml')) value = value.substring(0, value.length - 4)
    return this.preload.some((name) => value.includes(name))
  }

  pageExists(value: string) {
    if (value.endsWith('_en')) value = value.substring(0, value.length - 3)
    if (value.endsWith('.yml')) value = value.substring(0, value.length - 4)
    return this.pages.some((name) => value.includes(name))
  }

  getURL(name: string, type = 'page' as 'page' | 'asset') {
    if (this.preloadExists(name) || this.pageExists(name)) {
      if (type === 'page') {
        if (!name.endsWith('.yml')) name += '.yml'
        if (!this.baseUrl) {
          throw new Error(`baseUrl is missing`)
        }
        return `${this.baseUrl}${name}`
      } else {
        if (!this.assetsUrl) {
          throw new Error(`assetsUrl is missing`)
        }
        return `${this.assetsUrl}${name}`
      }
    }
    return name
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
