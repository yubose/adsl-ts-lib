import * as u from '@jsmanifest/utils'
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

  resolve(
    key: LiteralUnion<'version', string>,
    deviceType: DeviceType,
    env?: Env,
  ): string | number

  resolve(
    key: LiteralUnion<KeyOfRootConfig, string>,
    deviceType?: DeviceType,
  ): string | number

  resolve(
    arg1: LiteralUnion<KeyOfRootConfig | 'version', string>,
    arg2: DeviceType | { deviceType?: DeviceType; env?: Env } = {},
    arg3?: any,
  ) {
    if (arg1) {
      if (arg1 === 'version') {
        if (u.isStr(arg2)) {
          if (!this.get(arg2)) {
            throw new Error(`Device type "${arg2}" was not set on the config`)
          }
          const env = arg3 || 'stable'
          return this.get(arg2)?.cadlVersion?.[env]
        } else {
          throw new Error(`deviceType is not a string`)
        }
      }

      if (u.isStr(arg1)) {
        return replacePlaceholders(arg1, this.toJSON())
      }

      return arg1
    }

    const props = this.toJSON()
    const values = {
      cadlBaseUrl: this.get('cadlBaseUrl'),
      cadlVersion: this.resolve('version', u.isStr(arg2) ? arg2 : 'web'),
    } as Record<string, any>

    if (this['designSuffix']) values.designSuffix = this['designSuffix']

    return replacePlaceholders(props, this)
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
      if (u.isObj(value)) {
        super.set(key, {
          cadlVersion: {
            ...this.get(key)?.cadlVersion,
            ...value,
          },
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
