import { consts, is as coreIs, fp } from 'noodl-core'
import { Scalar, Pair, YAMLMap, YAMLSeq } from 'yaml'
import getJsType from '../utils/getJsType'
import is from '../utils/is'
import {
  IfItemKind,
  Kind,
  MapKind,
  ScalarType,
  SeqKind,
  ScalarKind,
  ProcessWriteType,
} from '../constants'
import { isScalar, isMap, isPair, isSeq } from '../utils/yaml'
import type { Processor } from './compilerTypes'
import * as t from '../types'

export function getNodeKind<N = unknown>(node: N) {
  if (isScalar(node)) {
    const { value } = node
    if (coreIs.str(value)) {
      if (coreIs.reference(value)) {
        return ScalarKind.Reference
      }
    }
    return ScalarKind.Unknown
  }
  //
  else if (isMap(node)) {
    return getMapKind(node)
  }
  //
  else if (isSeq(node)) {
    //
  }

  return Kind.Unknown
}

export function getScalarType(node: Scalar) {
  switch (getJsType(node.value)) {
    case 'array':
      return ScalarType.Array
    case 'boolean':
      return ScalarType.Boolean
    case 'number':
      return ScalarType.Number
    case 'object':
      return ScalarType.Object
    case 'string':
      return ScalarType.String
    case 'undefined':
      return ScalarType.Undefined
    default:
      return ScalarType.Unknown
  }
}

export function getScalarKind(node: Scalar) {
  if (typeof node.value === 'boolean') {
    //
  } else if (coreIs.num(node.value)) {
    //
  } else if (coreIs.str(node.value)) {
    if (coreIs.reference(node.value)) {
      return ScalarKind.Reference
    }
  }
  return ScalarKind.Unknown
}

export function getMapKind(node: YAMLMap) {
  if (is.action(node)) return MapKind.Action
  if (is.builtInFn(node)) return MapKind.BuiltInFn
  if (is.component(node)) return MapKind.Component
  if (is.emit(node)) return MapKind.Emit
  if (is.goto(node)) return MapKind.Goto
  if (is.if(node)) return MapKind.If
  if (is.style(node)) return MapKind.Style
  return MapKind.Unknown
}

export function getSeqKind(node: YAMLSeq) {
  //
}

export function getIfNodeItemKind(index: number) {
  switch (index) {
    case 0:
      return IfItemKind.Condition
    case 1:
      return IfItemKind.Truthy
    case 2:
      return IfItemKind.Falsey
  }
}

export function getProcessWriteType(value: any) {
  switch (value) {
    case consts.CharCode.Dot:
      return ProcessWriteType.LocalMerge
    case '..':
      return ProcessWriteType.RootMerge
    case consts.CharCode.At:
      return ProcessWriteType.AtMerge
    default:
      return ProcessWriteType.Unknown
  }
}
