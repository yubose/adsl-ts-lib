import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { excludeIteratorVar, toDataPath, trimReference } from 'noodl-utils'
import get from 'lodash/get'
import is from './utils/is'

export interface DerefOptions {
  dataObject?: Record<string, any>
  iteratorVar?: string
  path?: (string | number)[]
  ref: LiteralUnion<ReferenceString, string> | Record<string, any> | any[]
  root: Record<string, any>
  rootKey?: string
}

/**
 * Deeply dereferences a reference string, an array of values, or an object that contains a reference within
 *
 * @param deref options
 * @returns The dereferenced value
 */
function deref({
  dataObject,
  iteratorVar = '',
  path = [],
  ref,
  root,
  rootKey = '',
}: DerefOptions) {
  let value = ref

  if (value) {
    if (u.isStr(value)) {
      let datapath = toDataPath(trimReference(value))
      let isLocal = is.reference(value)

      if (u.isStr(value)) {
        while (is.reference(value)) {
          if (is.traverseReference(value)) {
            let parts = value.trim().split('_')
            let index = parts.length - 1

            while (!parts[0].startsWith('.') && index >= 0) {
              parts.shift()
              index--
            }

            if (index < 0) {
              return
            }

            if (parts.length) {
              if (parts[0].startsWith('.')) parts[0] = parts[0].slice(1)

              datapath = parts

              let result = get(dataObject || root, parts)

              if (result == null) {
                if (datapath.length && is.localKey(datapath[0])) {
                  // One more attempt
                  result = get(root, [rootKey, ...datapath])
                }
              }

              if (u.isStr(result)) {
                if (is.reference(result)) {
                  if (is.rootReference(result)) {
                    datapath = toDataPath(trimReference(result))
                    if (datapath[0] === rootKey) {
                      datapath.shift()
                    }
                  } else {
                    datapath = toDataPath(trimReference(result))
                    datapath.unshift(rootKey)
                  }

                  return deref({ ...arguments[0], ref: get(root, datapath) })
                }
                return get(dataObject, datapath)
              }
              return result
            }
          } else {
            isLocal = is.localReference(value)

            if (isLocal) {
              if (rootKey && datapath[0] === rootKey) datapath.shift()
            } else {
              if (rootKey !== datapath[0]) {
                rootKey = datapath.shift() || ''
              } else {
                datapath.shift()
              }
            }
          }

          value = get(root, [rootKey, ...datapath])

          if (typeof value === 'string') {
            datapath = toDataPath(trimReference(value))
          }
        }

        if (u.isStr(value)) {
          if (iteratorVar && value.startsWith(iteratorVar) && dataObject) {
            // ref === 'itemObject'
            if (value === iteratorVar) return dataObject
            return deref({
              ...arguments[0],
              ref: get(
                dataObject,
                excludeIteratorVar(value, iteratorVar) || '',
              ),
            })
          }
        }
      }
    } else if (u.isArr(value)) {
      return value.map((val, index) =>
        deref({ ...arguments[0], path: path.concat(index), ref: val }),
      )
    } else if (u.isObj(value)) {
      u.entries(value).forEach(([key, val]) => {
        if ((u.isStr(val) && is.reference(val)) || u.isObj(val)) {
          return (value[key] = deref({
            ...arguments[0],
            path: path.concat(key),
            ref: val,
          }))
        }
      })
    }
  }

  return value
}

export default deref
