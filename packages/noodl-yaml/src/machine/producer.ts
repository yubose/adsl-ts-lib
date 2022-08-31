import type { RootConfig, AppConfig } from 'noodl-types'
import inv from 'invariant'
import { fp, is, trimReference } from 'noodl-core'
import {
  isCollection,
  isMap,
  isScalar,
  isPair,
  isSeq,
  isNode,
} from '../utils/yaml'
import deref from '../utils/deref'
import get from '../utils/get'
import unwrap from '../utils/unwrap'
import * as c from '../constants'
import * as mu from './machineUtils'
import * as t from './machineTypes'

export type Produce = ReturnType<typeof createProducer>

export function createProducer() {
  return function producer(
    value: unknown,
    options?: t.ResolveOptions & {
      meta?: Record<string, any>
      onMetaCreated?: (meta: t.MetaObject) => t.MetaObject
      transform?: (value: t.MetaObject & Record<string, any>) => any
    },
  ) {
    if (is.str(value)) {
      if (is.reference(value)) {
        const meta = (options?.meta as t.MetaObject) || {}
        const onMetaCreated = options?.onMetaCreated || ((m) => m)

        meta.type = c.Meta.Reference
        meta.value = value

        if (!('kind' in meta)) {
          meta.kind = mu.getReferenceMetaKind(value)
        }

        if (mu.isContainsAwaitReference(meta)) {
          if (!('local' in meta)) meta.local = is.localReference(meta.value)
          meta.path = trimReference(meta.value).split('.')
        }

        if (mu.isContainsMergeReference(meta)) {
          if (!('local' in meta)) meta.local = is.localReference(meta.value)
        }

        if (mu.isContainsEvalReference(meta)) {
          if (!('local' in meta)) meta.local = is.localReference(meta.value)
          if (is.fnc(options?.transform)) {
            meta.valueTransformed = options?.transform(meta)
          }
        }

        if (is.traverseReference(meta.value)) {
          const parts = meta.value.split('_')
          meta.key = parts.pop().substring(1)
          meta.depth = parts.length
        }

        if (is.tildeReference(meta.value)) {
          meta.pathname = meta.value.substring(2)
        }

        return onMetaCreated(meta)
      } else {
        //
      }
    }
  }
}
