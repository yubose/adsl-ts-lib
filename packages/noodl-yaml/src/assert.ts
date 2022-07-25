import partialRight from 'lodash/partialRight'
import { is as coreIs, fp } from 'noodl-core'
import type { Scalar, Pair, YAMLMap, YAMLSeq, Document } from 'yaml'
import type { DiagnosticsHelpers } from 'noodl-core'
import is from './utils/is'
import * as utils from './asserters/assertUtils'
import { Kind } from './constants'
import * as t from './types'

export const assertUtils = {
  ...utils,
  is,
}

function anyPass<F extends (...args: any[]) => any>(
  fnOrFns: F | F[] | undefined,
  ...args: any[]
) {
  return fp.toArr(fnOrFns).some((fn) => fn?.(...args))
}

function allPass<F extends (...args: any[]) => any>(
  fnOrFns: F | F[] | undefined,
  ...args: any[]
) {
  return fp.toArr(fnOrFns ?? []).every((fn) => fn?.(...args))
}

function getNodeFnWithNodeKind(kind: Kind, condConfig: CondConfigObject) {
  switch (kind) {
    case Kind.Scalar:
      return condConfig.scalar
    case Kind.Pair:
      return condConfig.pair
    case Kind.Map:
      return condConfig.map
    case Kind.Seq:
      return condConfig.seq
    case Kind.Document:
      return condConfig.doc
    default:
      return condConfig.node
  }
}

export interface CondConfigObject<R = boolean> {
  node?: FnCondition<t.YAMLNode, R> | FnCondition<t.YAMLNode, R>[]
  scalar?: FnCondition<Scalar, R> | FnCondition<Scalar, R>[]
  pair?: FnCondition<Pair, R> | FnCondition<Pair, R>[]
  map?: FnCondition<YAMLMap, R> | FnCondition<YAMLMap, R>[]
  seq?: FnCondition<YAMLSeq, R> | FnCondition<YAMLSeq, R>[]
  doc?:
    | FnCondition<Document | Document.Parsed, R>
    | FnCondition<Document | Document.Parsed, R>[]
}

export type FnCondition<N = unknown, R = boolean> = (node: N) => R

export type Condition<N = unknown, R = boolean> =
  | CondConfigObject<R>
  | FnCondition<N, R>

export interface InternalCondFn<N = unknown> {
  (kind: Kind, node: N)
}

export function createAssert<N = any>({
  cond,
  fn,
}: {
  cond: Condition | Condition[]
  fn: t.AssertFn<N, DiagnosticsHelpers>
}): {
  cond: InternalCondFn<N>
  fn: t.AssertFn<N, DiagnosticsHelpers>
} {
  function _cond(nodeKind: Kind, node: unknown, condFn?: typeof cond) {
    if (coreIs.fnc(condFn)) {
      return condFn(node)
    } else if (coreIs.arr(condFn)) {
      return condFn.every((c) => _cond(nodeKind, node, c))
    } else if (coreIs.obj(condFn)) {
      if (anyPass(getNodeFnWithNodeKind(nodeKind, condFn), node)) return true
    }
    return false
  }
  return {
    cond: partialRight(_cond, cond),
    fn: partialRight(fn, assertUtils),
  }
}

/**
 * TODO - Work on this later
 */
export function createAsyncAssert<N = unknown>({
  cond,
  fn,
}: {
  cond: Condition<Promise<boolean>> | Condition<Promise<boolean>>[]
  fn: t.AssertAsyncFn<N>
}) {
  function _cond(nodeKind: Kind, node: unknown, condFn?: typeof cond) {
    if (coreIs.fnc(condFn)) {
      return condFn(node as any)
    } else if (coreIs.arr(condFn)) {
      return condFn.some((c) => _cond(nodeKind, node, c))
    } else if (coreIs.obj(condFn)) {
      if (allPass(getNodeFnWithNodeKind(nodeKind, condFn), node)) return true
    }
    return false
  }
  return {
    cond: partialRight(_cond, cond),
    fn: partialRight(fn, assertUtils),
  }
}
