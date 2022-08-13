import * as u from '@jsmanifest/utils'
import path from 'path'
import Strategy from './strategy'
import { fetchYml } from '../utils/yml'
import { url as isURL } from '../utils/is'
import { _id, StrategyKind } from '../constants'

class UrlStrategy extends Strategy {
  #id: string

  constructor() {
    super()
    this.#id = u.getRandomKey()
  }

  get kind() {
    return StrategyKind.Url
  }

  get id() {
    return this.#id
  }

  is(value: unknown) {
    return isURL(value)
  }

  /**
   * @param value String or URL
   * @param Options
   * @returns The value formatted into a URL
   */
  format(
    value: unknown,
    {
      name = '',
      ext = '',
      config,
      cadlEndpoint,
    }: Record<string, any> & { name?: string; ext?: string },
  ) {
    let url: URL | undefined

    if (!this.is(value)) {
      if (typeof value === 'string') {
        if (value) {
          if (
            config.configKey.includes(value) ||
            config.appKey.includes(value)
          ) {
            url = new URL(
              `${config.baseUrl}${
                value.endsWith('.yml') ? `${value}.yml` : value
              }`,
            )
          }
        }
      } else {
        return ''
      }
    } else {
      return ''
    }

    return url?.toString() ?? ''
  }

  parse(value: URL | string, options: any) {
    let url = new URL(value)
    let { base: filename, name, ext } = path.parse(url.href)
    if (ext.startsWith('.')) ext = ext.substring(1)
    return { filename, name, ext, value }
  }

  /**
   * @param value string or URL object
   * @param options Load options
   *
   * @example
   * ```js
   * await load('https://public.aitmed.com/config/meetd2.yml')
   * await load('https://public.aitmed.com/cadl/www0.48/cadlEndpoint.yml')
   * ```
   */
  async load(value: URL | string) {
    const url = new URL(value instanceof URL ? value : new URL(value))
    return fetchYml(url.toString())
  }
}

export default UrlStrategy