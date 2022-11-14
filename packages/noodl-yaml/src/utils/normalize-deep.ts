import * as u from '@jsmanifest/utils'
import type { NormalizePropsContext } from 'noodl-ui'
import cloneDeep from 'lodash/cloneDeep'
import curry from 'lodash/curry'
import partial from 'lodash/partial'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import type { ComponentObject } from 'noodl-types'
import type { ViewportObject } from 'noodl-ui'
import { normalizeProps } from 'noodl-ui'
import { createProxy } from '../create-proxy'

const _bpCache = new WeakMap()
// const _weakCache = new WeakMap()

const setIfMissing = curry(
  (
    noodlKey: string,
    outputKey: string | undefined = noodlKey,
    props: any,
    component: any,
  ) => {
    if (has(component, noodlKey) && !has(props, outputKey)) {
      set(props, outputKey, get(component, noodlKey))
    }
  },
)

function applySetter(noodlKey: string, outputKey?: string) {
  return partial(setIfMissing, noodlKey, outputKey)
}

const applyPath = applySetter('path')
const applyDataKey = applySetter('dataKey', 'data-key')
const applyPlaceholder = applySetter('placeholder')
const applyViewTag = applySetter('viewTag', 'data-viewtag')

export function normalizeDeep(
  comp: ComponentObject | string,
  options?: {
    context?: NormalizePropsContext
    rootKey?: string
    root?: any
    viewport?: ViewportObject
  },
) {
  if (u.isStr(comp)) comp = { type: comp }
  const props = createProxy({})
  const normalized = normalizeProps(props, comp, {
    context: options?.context,
    pageName: options?.rootKey || '',
    root: options?.root || {},
    viewport:
      options?.viewport && typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 },
  })

  applyPath(normalized, comp)
  applyDataKey(normalized, comp)
  applyPlaceholder(normalized, comp)
  applyViewTag(normalized, comp)

  if (comp.children) {
    if (comp.type === 'list') {
      let listObject = comp.listObject
      let blueprint: any

      if (_bpCache.has(comp)) {
        blueprint = _bpCache.get(comp)
      } else {
        _bpCache.set(comp, cloneDeep(comp.children[0]))
        blueprint = _bpCache.get(comp)
      }

      if (u.isArr(listObject)) {
        normalized.children = listObject.map((dataObject, index) => {
          return normalizeDeep(blueprint, {
            ...options,
            context: { ...options?.context, dataObject, index },
          })
        })
      }
    } else {
      normalized.children = u.array(comp.children).reduce((acc, child) => {
        if (child == null) return acc
        return acc.concat(normalizeDeep(child, options))
      }, [])
    }
  }

  return normalized
}
