import * as u from '@jsmanifest/utils'
// import { isDocument, isScalar, isPair, isMap, isSeq } from '../utils/yml'
import regex from '../internal/regex'
import { _id, idKey } from '../constants'
import type Strategy from '../loader/strategy'
import type { Ext } from '../types'

export function typeOf(value: unknown) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}

export function image<S extends string = string>(
  value: unknown,
): value is `${S}.${Ext.Image}` {
  return u.isStr(value) && regex.image.test(value)
}

export function json<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Json}` {
  return /\.json/i.test(value)
}

export function pdf<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Pdf}` {
  return /\.pdf/i.test(value)
}

export function script<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Script}` {
  return regex.script.test(value)
}

export function text<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Text}` {
  return regex.text.test(value)
}

export function video<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Video}` {
  return regex.video.test(value)
}

export function file<S extends string = string>(
  value: unknown,
): value is `${S}.${Ext.Image | Ext.Video}` {
  if (!u.isStr(value)) return false
  if (value.startsWith('file:')) return true
  try {
    new URL(value) as any
    return false
  } catch (error) {}
  if (!value.includes('.') && !value.includes('/')) return false
  if (value.startsWith('/') && value.length > 1) return true
  if (/\.(com|cn|co|de|dev|edu|gov|in|io|ly|me|net|org|uk|us)/i.test(value)) {
    return false
  }
  return regex.file.test(value)
}

export function promise<V = any>(value: unknown): value is Promise<V> {
  return value !== null && typeof value === 'object' && 'then' in value
}

export function strategy(value: unknown): value is Strategy {
  return (
    value != null && typeof value === 'object' && value[idKey] === _id.strategy
  )
}

export function stringInArray(arr: any[], value: unknown) {
  if (Array.isArray(arr) && typeof value === 'string') {
    return arr.some((item) => item === value)
  }
  return false
}

export function yaml(value: unknown): value is `${string}.yml` {
  if (!u.isStr(value)) return false
  return value.endsWith('.yml')
}

export function url(value: unknown): boolean {
  if (typeof value !== 'string' && !(value instanceof URL)) return false

  let url: URL

  try {
    url = new URL(value)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
