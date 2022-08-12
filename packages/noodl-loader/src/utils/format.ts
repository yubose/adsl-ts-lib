import type { LiteralUnion } from 'type-fest'
import path from 'path'
import { fp, is } from 'noodl-core'
import {
  getNodeTypeLabel,
  isScalar,
  isPair,
  isMap,
  isSeq,
  merge,
  unwrap,
} from './yml'

export function configKey(value: string | null | undefined) {
  if (!is.str(value)) return String(value)
  value = value.replace(/(_en|\.yml$)/g, '')
  return value
}

export function appKey(value: string | null | undefined) {
  return configKey(value)
}

export function ensureSuffix(suffix: string, value = '') {
  if (!value.endsWith?.(suffix)) value += suffix
  return value
}

export function endpoint(...paths: string[]) {
  let current = [...paths]
  let endpoint = ''

  while (current.length) {
    let nextPath = current.shift()

    if (endpoint === '') {
      if (nextPath?.startsWith?.('http')) {
        endpoint += nextPath
        continue
      }
    }

    if (nextPath) {
      if (endpoint.endsWith?.('/')) {
        endpoint = endpoint.substring(0, endpoint.length - 1)
      }

      if (!nextPath.startsWith?.('/')) nextPath = `/${nextPath}`

      endpoint += nextPath
    }
  }

  return endpoint
}

export function joinPaths(...paths: any[]) {
  return path.join(...paths.map(String))
}

export function pageName(value: string | null | undefined) {
  return configKey(value)
}

export function quoteIfEmptyStr(value: any) {
  return value === '' ? "''" : value
}

export function toObject(value: unknown): Record<string, any> {
  const props = {} as Record<string, any>

  if (is.obj(value)) {
    if (isScalar(value)) {
      fp.merge(props, toObject(value))
    } else if (isPair(value)) {
      props[String(value.key)] = unwrap(value.value)
    } else if (isMap(value)) {
      merge(props, value)
    } else if (!isSeq(value) && !is.arr(value)) {
      merge(props, value)
    }
  }

  return props
}

export function toPathname(value: string | null | undefined): string {
  if (!is.str(value)) return '/' + String(value)
  if (!value.startsWith('/')) value = `/${value}`
  return value
}
