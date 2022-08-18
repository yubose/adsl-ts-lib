import type { LiteralUnion } from 'type-fest'
import inv from 'invariant'
import KeyValueCache from './cache/key-value-cache'
import { ensureSuffix } from './utils/format'
import { replacePlaceholders } from './utils/replace'
import type NoodlConfig from './config'
import { stringify } from './utils/yml'

type KeyOfCadlEndpoint =
  | 'assetsUrl'
  | 'baseUrl'
  | 'fileSuffix'
  | 'languageSuffix'
  | 'preload'
  | 'page'
  | 'startPage'

class NoodlCadlEndpoint extends KeyValueCache<
  LiteralUnion<KeyOfCadlEndpoint, string>
> {
  #config: NoodlConfig | null = null;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(config?: NoodlConfig) {
    super()
    this.setConfig(config || null)
  }

  get assetsUrl() {
    return (this.get('assetsUrl') || '') as string
  }

  set assetsUrl(assetsUrl: string) {
    this.set('assetsUrl', assetsUrl)
  }

  get baseUrl() {
    return (this.get('baseUrl') || '') as string
  }

  set baseUrl(baseUrl: string) {
    this.set('baseUrl', baseUrl)
  }

  get startPage() {
    return (this.get('startPage') || '') as string
  }

  preloadExists(value: string) {
    if (value.endsWith('_en')) value = value.substring(0, value.length - 3)
    if (value.endsWith('.yml')) value = value.substring(0, value.length - 4)
    return this.getPreload().some((name: string) => value.includes(name))
  }

  pageExists(value: string) {
    if (value.endsWith('_en')) value = value.substring(0, value.length - 3)
    if (value.endsWith('.yml')) value = value.substring(0, value.length - 4)
    return this.getPages().some((name: string) => value.includes(name))
  }

  getPreload() {
    if (!this.has('preload')) this.set('preload', [])
    return this.get('preload') as string[]
  }

  getPages() {
    if (!this.has('page')) this.set('page', [])
    return this.get('page') as string[]
  }

  getURL(name: string) {
    const isPreload = this.preloadExists(name)
    const isPage = this.pageExists(name)
    let url = name
    if (isPreload || isPage) {
      name = ensureSuffix('.yml', name)
      if (isPage) {
        let baseUrl = this.baseUrl
        inv(!!baseUrl, `baseUrl cannot be empty`)
        baseUrl = replacePlaceholders(baseUrl, this.#config?.toJSON())
        url = `${baseUrl}${name}`
      } else {
        let assetsUrl = this.assetsUrl
        inv(!!assetsUrl, `assetsUrl cannot be empty`)
        url = `${assetsUrl}${name}`
      }
    } else {
      let baseUrl = this.baseUrl
      inv(!!baseUrl, `baseUrl cannot be empty`)
      baseUrl = replacePlaceholders(baseUrl, this.#config?.toJSON())
      url = `${baseUrl}cadlEndpoint.yml`
    }
    console.log(`[cadlEndpoint] Returning url via getURL: ${url}`)

    return url
  }

  setConfig(config: NoodlConfig | null) {
    this.#config = config
    return this
  }

  toJSON() {
    return this.get()
  }

  override toString() {
    return stringify(this.toJSON())
  }
}

export default NoodlCadlEndpoint
