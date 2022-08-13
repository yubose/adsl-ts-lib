import { fp, is } from 'noodl-core'
import type { LiteralUnion } from 'type-fest'
import type { DeviceType, Env } from 'noodl-types'
import { stringify } from './utils/yml'
import { replacePlaceholders } from './utils/replace'
import KeyValueCache from './cache/key-value-cache'

type KeyOfRootConfig =
  | DeviceType
  | 'apiHost'
  | 'apiPort'
  | 'webApiHost'
  | 'appApiHost'
  | 'connectiontimeout'
  | 'loadinglevel'
  | 'debug'
  | 'viewWidthHeightRatio'
  | 'cadlBaseUrl'
  | 'cadlMain'
  | 'timestamp'
  | 'myBaseUrl'
  | 'keywords'

class NoodlConfig extends KeyValueCache<LiteralUnion<KeyOfRootConfig, string>> {
  rootConfigUrl = ''
  appKey = ''
  configKey = '';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  get baseUrl() {
    return (this.get('cadlBaseUrl') || '') as string
  }

  getTimestamp() {
    let date = new Date()
    let dateStr = ''

    dateStr += date.getMonth()
    dateStr += date.getDate()
    dateStr += date.getFullYear()
    dateStr += '.'
    // TODO - Implement this correctly
    dateStr += 'PDT'

    return dateStr
  }

  resolve(): any

  resolve(
    key: LiteralUnion<'version', string>,
    deviceType: DeviceType,
    env?: Env,
  ): any

  resolve(
    key: LiteralUnion<KeyOfRootConfig, string>,
    deviceType?: DeviceType,
  ): any

  resolve(
    arg1?: LiteralUnion<KeyOfRootConfig | 'version', string>,
    arg2: DeviceType | { deviceType?: DeviceType; env?: Env } = {},
    arg3?: any,
  ) {
    if (!arguments.length) {
      const props = this.toJSON()

      const values = {
        apiHost: this.get('apiHost'),
        apiPort: this.get('apiPort'),
        cadlBaseUrl: this.get('cadlBaseUrl'),
        cadlVersion: this.resolve('version', 'web'),
      } as Record<string, any>

      if (this.has('designSuffix')) {
        values.designSuffix = this.get('designSuffix')
      }

      console.log({ values })

      for (const [key, value] of fp.entries(props)) {
        if (is.str(value) && this.has(value)) {
          props[key] = this.get(value)
        }
      }

      return replacePlaceholders(props, values)
    }

    if (arg1) {
      if (arg1 === 'version') {
        if (is.str(arg2)) {
          if (!this.get(arg2)) {
            throw new Error(`Device type "${arg2}" was not set on the config`)
          }

          const env = arg3 || 'stable'
          return this.get(arg2)?.cadlVersion?.[env]
        } else {
          throw new Error(`deviceType is not a string`)
        }
      }

      if (is.str(arg1)) {
        return replacePlaceholders(arg1, this.toJSON())
      }
    }

    return arg1
  }

  override set(
    key: LiteralUnion<DeviceType, string>,
    values?: {
      stable?: string | number
      test?: string | number
    },
  ): this

  override set(
    key: LiteralUnion<'viewWidthHeightRatio', string>,
    values?: {
      min?: number
      max?: number
    },
  ): this

  override set(key: LiteralUnion<KeyOfRootConfig, string>, value: any): this

  override set(key: LiteralUnion<KeyOfRootConfig, string>, value: any) {
    if (['web', 'ios', 'android'].includes(key)) {
      if (is.obj(value)) {
        super.set(key, {
          ...this.get(key)?.cadlVersion,
          ...value,
        })
      } else {
        super.set(key, value)
      }
    } else {
      if (key === 'cadlMain') this.appKey = value
      super.set(key, value)
    }
    return this
  }

  toJSON() {
    return {
      cadlMain: this.appKey,
      timestamp: this.getTimestamp(),
      ...this.get(),
    }
  }

  override toString() {
    return stringify(this.toJSON())
  }
}

export default NoodlConfig
