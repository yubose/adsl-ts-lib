import type { LiteralUnion } from 'type-fest'
import KeyValueCache from './cache/key-value-cache'
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

  getURL(name: string, type = 'page' as 'page' | 'asset') {
    if (this.preloadExists(name) || this.pageExists(name)) {
      if (type === 'page') {
        if (!name.endsWith('.yml')) name += '.yml'
        if (!this.get('baseUrl')) {
          throw new Error(`baseUrl is missing`)
        }
        return `${this.get('baseUrl')}${name}`
      } else {
        if (!this.get('assetsUrl')) {
          throw new Error(`assetsUrl is missing`)
        }
        return `${this.get('assetsUrl')}${name}`
      }
    }
    return name
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
