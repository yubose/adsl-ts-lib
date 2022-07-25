import type { IGlobalObject } from '../../types'

class GlobalRecord<T extends string> implements IGlobalObject<T> {
  // @ts-expect-error
  type: T
}

export default GlobalRecord
