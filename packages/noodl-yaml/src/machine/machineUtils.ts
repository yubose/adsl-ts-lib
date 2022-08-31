import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import { is } from 'noodl-core'
import * as R from 'rambda'
import * as t from './machineTypes'
import * as c from '../constants'

export function getReferenceMetaKind(
  ref: LiteralUnion<`=.${string}@`, string>,
): [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]

export function getReferenceMetaKind(
  ref: LiteralUnion<ReferenceString, string>,
): c.MetaKind

export function getReferenceMetaKind<R extends string>(
  ref: LiteralUnion<R, string>,
) {
  let kind: unknown

  if (is.awaitReference(ref)) {
    if (is.evalReference(ref)) {
      kind = [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]
    } else {
      kind = c.MetaKind.AwaitReference
    }
  } else if (is.evalReference(ref)) {
    kind = c.MetaKind.EvalReference
  } else if (is.localReference(ref) || is.rootReference(ref)) {
    kind = c.MetaKind.MergeReference
  } else if (is.tildeReference(ref)) {
    kind = c.MetaKind.TildeReference
  } else if (is.traverseReference(ref)) {
    kind = c.MetaKind.TraverseReference
  } else {
    kind = c.MetaKind.Unknown
  }

  return kind as R extends `=.${string}@`
    ? [c.MetaKind.AwaitReference, c.MetaKind.EvalReference]
    : c.MetaKind
}

const createIsContainsReferenceKind = R.curry(
  (kind: c.MetaKind, value: t.MetaObject | c.MetaKind | c.MetaKind[]) => {
    if (value === kind) return true
    if (is.arr(value)) return value.some((k) => k === kind)
    if (is.obj(value)) {
      return is.arr(value.kind)
        ? value.kind.some((k) => k === kind)
        : value.kind === kind
    }
    return false
  },
)

export const isContainsAwaitReference = createIsContainsReferenceKind(
  c.MetaKind.AwaitReference,
)

export const isContainsEvalReference = createIsContainsReferenceKind(
  c.MetaKind.EvalReference,
)

export const isContainsMergeReference = createIsContainsReferenceKind(
  c.MetaKind.MergeReference,
)
