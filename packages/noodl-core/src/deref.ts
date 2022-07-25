/**
 * TODO - Not being used yet (copied from noodl-ui)
 */

import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { excludeStr, get } from './utils/fp'
import { getRefProps } from './utils/noodl'
import * as is from './utils/is'
import * as t from './types'

export interface DerefOptions {
  dataObject?: Record<string, any>
  iteratorVar?: string
  path?: (number | string)[]
  ref: any[] | LiteralUnion<ReferenceString, string> | Record<string, any>
  root?: Record<string, any> | t.ARoot
  rootKey?: string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
  identifiers?: {
    arr: <A = any[]>(value: any) => value is A
    obj: <O = Record<string, any>>(value: any) => value is O
    str: <S = string>(value: any) => value is S
    num: <N = number>(value: any) => value is N
    ref: <R = ReferenceString>(value: any) => value is R
    localRef: (value: any) => boolean
    rootRef: (value: any) => boolean
    localKey: (value: any) => boolean
    traverseRef: (value: any) => boolean
  }
}

const defaultIdentifiers = {
  arr: is.arr,
  obj: is.obj,
  num: is.num,
  ref: is.reference,
  str: is.str,
  localKey: is.localKey,
  localRef: is.localReference,
  rootRef: is.rootReference,
  traverseRef: is.traverseReference,
}

const identifierKeys = Object.keys(defaultIdentifiers)

const cache = new Map()
cache.set('identifiers', [{ identifiers: defaultIdentifiers }])

function createDerefReducer(
  root: Record<string, any> | undefined,
  rootKey = '',
  subscribers?: DerefOptions['subscribe'],
) {
  let _result: any
  let _state = {
    paths: [] as string[],
    results: [] as any[],
  }

  function reducer(
    state: typeof _state,
    action: Parameters<typeof dispatch>[0],
  ) {
    switch (action.type) {
      case 'start': {
        const { isLocalRef, paths } = getRefProps(action.reference)
        if (isLocalRef && rootKey) paths.unshift(rootKey)
        _result = get(root?.value, paths[0] as string)
        return { ...state, paths: paths.slice(1) }
      }
      case 'next': {
        _result = get(_result, state.paths[0])
        return {
          ...state,
          paths: state.paths.slice(1),
          results: state.results.concat({
            key: state.paths[0],
            value: _result,
          }),
        }
      }
    }
  }

  function dispatch(
    action: { type: 'next' } | { type: 'start'; reference: ReferenceString },
  ) {
    const prevState = _state
    _state = reducer(_state, action) as typeof _state
    subscribers?.onUpdate?.(prevState, _state)
  }

  return {
    getState: () => ({ ..._state, value: _result }),
    dispatch,
  }
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
  path: currentPath = [],
  ref: value,
  root,
  rootKey = '',
  identifiers: idy,
}: DerefOptions) {
  if (!idy) {
    idy = defaultIdentifiers as NonNullable<DerefOptions['identifiers']>
  }

  // const idyValidation = cache
  //   .get('identifiers')
  //   ?.find?.((o) => o.identifiers === idy)

  // console.log({ idyValidation })

  // if (idyValidation) {
  //   const implementedIdentifiers = identifierKeys.filter(
  //     (key) => key in (idy || {}),
  //   )

  //   if (implementedIdentifiers.length < identifierKeys.length) {
  //     throw new Error(
  //       `Missing ${
  //         identifierKeys.length - implementedIdentifiers.length
  //       } identifier implementations: ${identifierKeys
  //         .filter((key) => !implementedIdentifiers.includes(key))
  //         .join(', ')}`,
  //     )
  //   }
  // }

  let { isLocalKey, isLocalRef, path, paths, ref } = getRefProps(
    value as ReferenceString,
  )

  if (!iteratorVar) {
    if (isLocalRef) {
      if (rootKey) {
        if (root) {
          return get(root, `${rootKey}.${path}`)
        }
      } else {
        return ref
      }
    } else {
      return get(root, path)
    }
  }

  if (idy.str?.(value)) {
    if (is.reference(value)) {
      // while (idy.ref?.(value)) {
      //   if (idy.traverseRef?.(ref)) {
      //     let parts = value.trim().split('_')
      //     let index = parts.length - 1
      //     while (!parts[0].startsWith('.') && index >= 0) {
      //       parts.shift()
      //       index--
      //     }
      //     if (index < 0) {
      //       return
      //     }
      //     if (parts.length) {
      //       if (parts[0].startsWith('.')) parts[0] = parts[0].slice(1)
      //       datapath = parts
      //       let result = get(dataObject || root, parts)
      //       if (result == null) {
      //         if (datapath.length && idy.localKey?.(datapath[0])) {
      //           // One more attempt
      //           result = get(root, [rootKey, ...datapath])
      //         }
      //       }
      //       if (idy.str?.(result)) {
      //         if (idy.ref?.(result)) {
      //           if (idy.rootRef?.(result)) {
      //             datapath = toPath(trimReference(result))
      //             if (datapath[0] === rootKey) {
      //               datapath.shift()
      //             }
      //           } else {
      //             datapath = toPath(trimReference(result))
      //             datapath.unshift(rootKey)
      //           }
      //           return deref({ ...arguments[0], ref: get(root, datapath) })
      //         }
      //         return get(dataObject, datapath)
      //       }
      //       return result
      //     }
      //   } else {
      //     isLocal = idy.localRef?.(value)
      //     if (isLocal) {
      //       if (rootKey && datapath[0] === rootKey) datapath.shift()
      //     } else {
      //       if (rootKey !== datapath[0]) {
      //         rootKey = datapath.shift() || ''
      //       } else {
      //         datapath.shift()
      //       }
      //     }
      //   }
      //   value = get(root, [rootKey, ...datapath])
      //   if (typeof value === 'string') {
      //     datapath = toPath(trimReference(value))
      //   }
      // }
    }

    if (idy.str?.(value)) {
      if (iteratorVar && value.startsWith(iteratorVar) && dataObject) {
        // ref === 'itemObject'
        if (value === iteratorVar) return dataObject
        return deref({
          ...arguments[0],
          ref: get(dataObject, excludeStr(value, iteratorVar) || ''),
        })
      }
    }
  } else if (idy.arr?.(value)) {
    return (value as any[]).map((val, index) =>
      deref({ ...arguments[0], path: path.concat(index as any), ref: val }),
    )
  } else if (idy.obj?.(value)) {
    Object.entries(value).forEach(([key, val]) => {
      if ((idy?.str?.(val) && idy?.ref?.(val)) || idy?.obj?.(val)) {
        return (value[key] = deref({
          ...arguments[0],
          path: path.concat(key),
          ref: val,
        }))
      }
    })
  }

  return value
}

export default deref
