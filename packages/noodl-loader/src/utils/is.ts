import * as u from '@jsmanifest/utils'
import { is } from 'noodl-core'
import regex from '../internal/regex'
import { _id, idKey } from '../constants'
import type FileSystemHost from '../file-system'
import type Strategy from '../loader/strategy'
import type { Ext } from '../types'

/**
 * Returns true if two names are equivalent when comparing for existence in lists with/without the `.yml` extension
 *
 * @example
 * ```js
 * isEqualFileKey('www', 'www.yml') // true
 * isEqualFileKey('www', 'www') // true
 * isEqualFileKey('.yml', '') // true
 * isEqualFileKey('', '') // true
 * isEqualFileKey('www', 'wwww.yml') // false
 * isEqualFileKey('www', 'www.ymll') // false
 * isEqualFileKey('www', 'wwww') // false
 * isEqualFileKey('www', '') // false
 * isEqualFileKey('www.yml', '') // false
 * ```
 */
export function equalFileKey(v1: unknown, v2: unknown) {
  if (!is.str(v1) || !is.str(v2)) return false
  if (v1 === v2) return true
  if (!v1.endsWith('.yml')) v1 += '.yml'
  if (!v2.endsWith('.yml')) v2 += '.yml'
  return v1.replace(/_en/, '') === v2.replace(/_en/, '')
}

export function fileSystemHost(value: unknown): value is FileSystemHost {
  return (
    value !== null &&
    typeof value === 'object' &&
    value?.[idKey] === _id.fileSystemHost
  )
}

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
  if (value.startsWith('http')) return false
  try {
    new URL(value) as any
    return false
  } catch (error) {}
  if (!value.includes('.') && !value.includes('/')) return false
  if (value.startsWith('/') && value.length > 1) return true
  if (value.startsWith('./')) return true
  if (/\.(com|cn|co|de|dev|edu|gov|in|io|ly|me|net|org|uk|us)/i.test(value)) {
    return false
  }
  return /^[a-zA-Z]/i.test(value) || regex.file.test(value)
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
