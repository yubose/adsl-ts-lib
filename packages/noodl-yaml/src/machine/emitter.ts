import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { is } from 'noodl-core'
import deref from '../utils/deref'
import { getRefInstructions } from './get-ref-instructions'
import { createProducer } from './producer'
import type { Produce } from './producer'
import type { Emit } from './machineTypes'
import * as c from '../constants'
import * as t from './machineTypes'

export type EmitterOptions = t.ResolveOptions & {
  meta?: Record<string, any>
  resolve?: (value: any) => any
  on?: {
    localReference?: (
      ref: `=..${string}` | `=..${string}@` | `..${string}` | `..${string}@`,
      opts?: t.ResolveOptions,
    ) => void
  }
}

function handleRef(
  ref: LiteralUnion<ReferenceString, string>,
  {
    meta = {},
    root = {},
  }: { meta?: Record<string, any>; root?: Record<string, any> } = {},
) {
  switch (meta.type) {
    case c.Meta.Base:
    case c.Meta.Reference: {
      switch (meta.kind) {
        case c.MetaKind.AwaitReference: {
          const _res = {} as Emit.AwaitReferenceResolution
          const _meta = meta as t.AwaitReferenceMeta
          const _instructions = getRefInstructions(_meta.value)
          // const { value: awaitValue } = _meta
          console.log({ _instructions })
          return { instructions: _instructions, meta: _meta, resolution: _res }
        }
        case c.MetaKind.EvalReference:
        case c.MetaKind.MergeReference:
        case c.MetaKind.TraverseReference:
        default:
          break
      }
    }
    case c.Meta.Unknown:
    default:
      break
  }
}

export function createEmitter({
  produce = createProducer(),
}: { produce?: Produce } = {}) {
  function emitter(
    awaitRef: `${string}@`,
    value: any,
    options?: EmitterOptions,
  ): any

  function emitter(value: unknown, options?: EmitterOptions): any

  function emitter(arg1: unknown, arg2?: any, arg3?: EmitterOptions): any {
    let _value = arg1
    let _options: EmitterOptions | undefined

    if (is.obj(arg3)) {
      _options = arg3
    } else if (is.obj(arg2)) {
      _options = arg2
    }

    if (is.str(_value)) {
      if (is.reference(_value)) {
        if (is.awaitReference(_value)) {
          let value = arg2
          if (is.str(value)) {
            if (is.reference(value)) {
              if (is.localReference(value)) {
                _options?.on?.localReference?.(value, _options)
                const rootKey = _options?.page || ''
                const root = _options?.root || {}
                const refValue = deref({
                  node: value,
                  rootKey,
                  root,
                })
                console.log({ refValue })
              } else {
                //
              }
            }
          }
        }
      }
    }

    // const resolve = _options?.resolve || ((value) => value)

    if (is.str(_value)) {
      if (is.reference(_value)) {
        const meta = produce(_value, _options)
        const instructions = handleRef(_value, { meta })
        console.log({ instructions, _value })
      }
    }

    if (is.obj(_value)) {
      if ('type' in _value) {
        if (c.Meta[_value.type]) {
          return emitter(_value.type, { ..._options, meta: _value })
        }
      }
    }
  }

  return emitter
}
