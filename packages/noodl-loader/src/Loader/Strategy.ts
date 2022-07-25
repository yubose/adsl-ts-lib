import { _id } from '../constants'
import { ALoaderStrategy } from '../types'

class NoodlLoaderStrategyBase extends ALoaderStrategy {
  constructor() {
    super()
    Object.defineProperty(this, _id.strategy, {
      configurable: false,
      enumerable: false,
      value: _id.strategy,
    })
  }

  load() {
    return { config: '', cadlEndpoint: '' }
  }
}

export default NoodlLoaderStrategyBase
