import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import is from './is'
import type { NormalizePropsContext } from '../types'

/**
 * Deeply resolves reference strings
 * @param ref Reference string
 * @param options Options
 * @returns The dereferenced value
 */
function getByRef(
  ref = '',
  {
    blueprint,
    context,
    props,
    root,
    rootKey,
    getParent,
  }: {
    blueprint: Partial<nt.ComponentObject>
    context: NormalizePropsContext | undefined
    props: Record<string, any>
    root: Record<string, any>
    rootKey?: string
    getParent?: any
  },
) {
  // TODO - Resolving traversal references is not working expectedly
  if (is.traverseReference(ref)) {
    if (u.isFnc(getParent)) {
      // ['', '', '', '.colorChange']
      let parts = ref.split('_')
      let depth = parts.filter((s) => s === '').reduce((acc) => ++acc, 0)
      let nextKey = parts.shift() as string

      while (nextKey && !nextKey.startsWith('.')) {
        if (nextKey === '') {
          // continue
        } else if (nextKey.startsWith('.')) {
          const parent = getParent({
            blueprint,
            context: context || {},
            props,
            op: 'traverse',
            opArgs: {
              depth,
              ref,
            },
          })
          return get(parent, nextKey[1].slice())
        }

        nextKey = parts.shift() as string
      }
    }
  }

  let refValue: any

  if (is.localReference(ref)) {
    if (rootKey) {
      refValue = get(root[rootKey], nu.toDataPath(nu.trimReference(ref)))
    }
  } else if (is.rootReference(ref)) {
    refValue = get(root, nu.toDataPath(nu.trimReference(ref)))
  }

  if (u.isStr(refValue) && is.reference(refValue)) {
    const path = nu.toDataPath(nu.trimReference(refValue))

    if (is.localReference(refValue)) {
      const prevPath = nu.toDataPath(nu.trimReference(ref))
      if (prevPath[0] !== rootKey) {
        rootKey = prevPath[0]
      }
    } else {
      if (path[0] !== rootKey) rootKey = path.shift()
    }

    return getByRef(refValue, { ...arguments[1], rootKey })
  }

  return refValue === undefined ? ref : refValue
}

export default getByRef
