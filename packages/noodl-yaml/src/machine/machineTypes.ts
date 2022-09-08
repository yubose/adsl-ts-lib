import type { RootConfig, AppConfig } from 'noodl-types'
import * as c from '../constants'

export namespace ActionToken {
  //
}

export namespace Emit {
  interface BaseResolution {
    action: string
  }

  export interface AwaitReferenceResolution extends BaseResolution {
    //
  }

  export interface SetFn {
    (
      options: {
        obj?: any
        key?: string | number
        value?: any
      } & ResolveOptions,
    ): void
    (obj: any, key: string | number, value: any, opts?: ResolveOptions): void
  }
}

export interface MetaObject {
  type: any
  kind?: any
  [key: string]: any
}

export interface ReferenceMeta extends MetaObject {
  type: c.Meta.Reference
  kind:
    | c.MetaKind.AwaitReference
    | c.MetaKind.EvalReference
    | c.MetaKind.MergeReference
    | c.MetaKind.TraverseReference
    | c.MetaKind.TildeReference
    | [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]
}

export interface AwaitReferenceMeta extends ReferenceMeta {
  kind:
    | c.MetaKind.AwaitReference
    | [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]
  key?: string
  local: boolean
  path: string[]
  value: `${string}@`
}

export interface EvalReferenceMeta extends ReferenceMeta {
  kind:
    | c.MetaKind.EvalReference
    | [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]
  value: `=..${string}` | `=.${string}`
  valueTransformed: any
  local: boolean
  transform?: (value: EvalReferenceMeta['value']) => any
}

export interface MergeReferenceMeta extends ReferenceMeta {
  kind: c.MetaKind.MergeReference
  local: boolean
  value: `..${string}` | `.${string}`
}

export interface TildeReferenceMeta<S extends string = string>
  extends ReferenceMeta {
  kind: c.MetaKind.TildeReference
  value: `~/${S}`
  pathname: S
}

export interface TraverseReferenceMeta extends ReferenceMeta {
  kind: c.MetaKind.TraverseReference
  value:
    | `_${string}`
    | `__${string}`
    | `___${string}`
    | `____${string}`
    | `_____${string}`
    | `______${string}`
    | `_______${string}`
  depth?: number
  key?: string
}

export interface ResolveOptions {
  config?: RootConfig
  cadlEndpoint?: AppConfig
  page?: string
  root?: Record<string, any>
}
