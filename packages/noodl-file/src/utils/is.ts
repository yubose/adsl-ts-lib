import regex from './regex'
import type { Ext } from '../types'

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
  return regex.file.test(value)
}

export function promise<V = any>(value: unknown): value is Promise<V> {
  return value !== null && typeof value === 'object' && 'then' in value
}

export function url(value: unknown): boolean {
  return typeof value === 'string' && regex.url.test(value)
}
