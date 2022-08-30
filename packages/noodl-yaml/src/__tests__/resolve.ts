import type { RootConfig, AppConfig } from 'noodl-types'
import { fp, is, deref } from 'noodl-core'
import {
  isCollection,
  isMap,
  isScalar,
  isPair,
  isSeq,
  isNode,
} from '../utils/yaml'
import get from '../utils/get'
import unwrap from '../utils/unwrap'
import * as c from '../constants'
import * as t from '../types'

export interface ResolveOptions {
  config?: RootConfig
  cadlEndpoint?: AppConfig
  page?: string
  root?: Record<string, any>
}

export function has(key: string | number | symbol, node: unknown) {
  if (isCollection(node)) {
    return node.has(key)
  }

  if (is.arr(node)) {
    if (is.num(key)) return node.length - 1 <= key
    key = Number(key)
    if (Number.isNaN(key)) return false
    return node.length - 1 <= key
  } else if (is.obj(node)) {
    return key in node
  }
}

export function resolve(value?: unknown, options?: ResolveOptions) {
  let _config = options?.config || {}
  let _cadlEndpoint = options?.cadlEndpoint || {}
  let _page = options?.page || ''
  let _root = options?.root || {}

  if (value == null) return value

  value = unwrap(value)

  if (!(isNode(value) && isPair(value))) {
    //
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (is.str(value)) {
    if (is.reference(value)) {
      const derefed = deref({
        ref: value,
        root: _root,
        rootKey: _page,
      })
      return resolve(derefed)
    } else if (['true', 'false'].some((v) => v === value)) {
      return value === 'true' ? true : false
    } else {
      return value
    }
  }

  if (is.num(value)) {
    return value
  }
}
