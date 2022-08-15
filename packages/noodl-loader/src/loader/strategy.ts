import { _id, idKey } from '../constants'
import type { LoaderCommonOptions } from './loader-types'

abstract class LoaderStrategyBase {
  abstract readonly kind: string
  abstract readonly id: string

  constructor() {
    Object.defineProperty(this, idKey, {
      configurable: false,
      enumerable: false,
      value: _id.strategy,
    })
  }

  abstract format(value: any, options: LoaderCommonOptions): any
  abstract is(value: any, options: LoaderCommonOptions): boolean
  abstract load(...args: any[]): Promise<string> | string
  abstract parse(
    value: any,
    options: LoaderCommonOptions,
  ): { name: string; ext?: string }
}

export default LoaderStrategyBase
