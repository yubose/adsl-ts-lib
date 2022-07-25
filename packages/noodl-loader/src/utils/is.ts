import regex from '../internal/regex'
import { _id } from '../constants'
import type { ALoaderStrategy, Ext } from '../types'

export function typeOf(value: unknown) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}

export function image<S extends string = string>(
  value: string,
): value is `${S}.${Ext.Image}` {
  return regex.image.test(value)
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
  value: string,
): value is `${S}.${Ext.Image | Ext.Video}` {
  if (typeof value !== 'string') return false
  if (value.startsWith('file:')) return true
  try {
    new URL(value) as any
    return false
  } catch (error) {}
  if (!value.includes('.') && !value.includes('/')) return false
  return regex.file.test(value)
}

export function promise<V = any>(value: unknown): value is Promise<V> {
  return value !== null && typeof value === 'object' && 'then' in value
}

export function strategy(value: unknown): value is ALoaderStrategy {
  return (
    value != null && typeof value === 'object' && value['_id'] === _id.strategy
  )
}

export function stringInArray(arr: any[], value: unknown) {
  if (Array.isArray(arr) && typeof value === 'string') {
    return arr.some((item) => item === value)
  }
  return false
}

export function url(value: unknown): boolean {
  if (typeof value !== 'string') return false

  let url: URL

  try {
    url = new URL(value)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
