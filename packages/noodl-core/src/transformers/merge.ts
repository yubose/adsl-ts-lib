import deref from '../deref'
import { excludeIteratorVar } from '../utils/noodl'
import * as fp from '../utils/fp'
import * as is from '../utils/is'

export interface MergeOptions {
  dataObject?: any
  iteratorVar?: string
  root?: Record<string, any>
  rootKey?: string
}

function _merge<N = any>(
  obj: N,
  refOrValue: any,
  { dataObject, iteratorVar, root, rootKey }: MergeOptions = {},
): N {
  let mergingValue: any
  let ref = is.str(refOrValue) && is.reference(refOrValue) && refOrValue

  if (is.nil(obj)) {
    return ref ? deref({ dataObject, ref, root, rootKey }) : refOrValue
  }

  if (!ref) {
    if (dataObject && iteratorVar) {
      if (is.iteratorVarKey(iteratorVar, refOrValue)) {
        const path = excludeIteratorVar(iteratorVar, refOrValue)
        mergingValue = path === '' ? dataObject : fp.get(dataObject, path)
      }
    }
  } else {
    if (ref) {
      // const refValue = deref()
    }
  }

  if (is.obj(obj)) {
    if (is.obj(mergingValue)) {
      return { ...obj, ...mergingValue }
    }
  }

  return obj
}

export default _merge
