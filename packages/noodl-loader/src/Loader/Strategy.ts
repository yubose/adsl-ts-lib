import { _id, idKey } from '../constants'
import type { LoaderCommonOptions } from '../types'

abstract class LoaderStrategyBase {
  constructor() {
    Object.defineProperty(this, idKey, {
      configurable: false,
      enumerable: false,
      value: _id.strategy,
    })
  }
  abstract is(value: any, options: LoaderCommonOptions): boolean
  abstract format(value: any, options: LoaderCommonOptions): any
  abstract parse(
    value: any,
    options: LoaderCommonOptions,
  ): { name: string; ext?: string }
  abstract load(...args: any[]): Promise<string> | string
}

export default LoaderStrategyBase
