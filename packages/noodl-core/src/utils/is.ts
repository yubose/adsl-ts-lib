import type { ReferenceString } from 'noodl-types'
import type { IViewport } from '../types'
import { ARoot } from '../types'
import * as regex from './regex'
import * as c from '../constants'
import type Diagnostic from '../diagnostics/Diagnostic'

export function arr<V extends any[] = any[]>(v: unknown): v is V {
  return Array.isArray(v)
}

/**
 * Returns true if the value is a NOODL boolean. A value is a NOODL boolean
 * if the value is truthy, true, "true", false, or "false"
 * @internal
 * @param { any } value
 */
export function bool(value: unknown) {
  return boolTrue(value) || boolFalse(value)
}

/** @internal */
export function boolTrue(value: unknown): value is 'true' | true {
  return value === true || value === 'true'
}

/** @internal */
export function boolFalse(value: unknown): value is 'false' | false {
  return value === false || value === 'false'
}

export const component = {
  any: (v: any) => obj(v) && ('type' in v || 'children' in v),
  header: (v: any) => obj(v) && v.type === 'header',
  image: (v: any) => obj(v) && v.type === 'image',
  list: (v: any) => obj(v) && v.type === 'list',
  listItem: (v: any) => obj(v) && v.type === 'listItem',
  listLike: (v: any) => obj(v) && (v.type === 'list' || v.type === 'chatList'),
  popUp: (v: any) => obj(v) && v.type === 'popUp',
  scrollView: (v: any) => obj(v) && v.type === 'scrollView',
  select: (v: any) => obj(v) && v.type === 'select',
  textView: (v: any) => obj(v) && v.type === 'textView',
  video: (v: any) => obj(v) && v.type === 'video',
}

export const header = component.header
export const image = component.image
export const list = component.list
export const listItem = component.listItem
export const listLike = component.listLike
export const popUp = component.popUp
export const scrollView = component.scrollView
export const select = component.select
export const textView = component.textView
export const video = component.video

export function diagnostic(value: unknown): value is Diagnostic {
  return obj(value) && value._id_ === c._symbol.diagnostic
}

export function iteratorVarKey(iteratorVar: string, key: string) {
  return iteratorVar !== '' && key.startsWith(iteratorVar)
}

/** @internal */
export function obj<V extends Record<string, any> = Record<string, any>>(
  v: unknown,
): v is V {
  return v !== null && !arr(v) && typeof v === 'object'
}

/** @internal */
export function str<S extends string = string>(v: unknown): v is S {
  return typeof v === 'string'
}

/**
 * true: ".Global.currentUser.vertex.name.firstName@"
 * true: "..message.doc.1.name@"
 * false: "..message.doc.1.name"
 */
export function awaitReference(v: string): v is ReferenceString<string, '@'> {
  if (v.endsWith('@')) return true
  return false
}

/**
 * True if the value starts with an equal sign "="
 * true: "=.builtIn.string.concat"
 * false: ".builtIn.string.concat"
 * false: "builtIn.string.concat"
 */
export function evalReference(v: string): v is ReferenceString<string, '='> {
  if (v.startsWith('=')) return true
  return false
}

/**
 * true: "=.."
 * false: "=."
 */
export function evalLocalReference(
  v: string,
): v is ReferenceString<string, '=..'> {
  if (v.startsWith('=..')) return true
  return false
}

export function localKey(v: string) {
  return !!(v && v[0].toLowerCase() === v[0] && !regex.numbers.test(v))
}

/**
 * true: "=."
 * false: "=.."
 */
export function evalRootReference(
  v: string,
): v is ReferenceString<string, '=.'> {
  if (v.startsWith('=.')) return true
  return false
}

/**
 * true: ".."
 * true: "=.."
 * false: "=."
 */
export function localReference(v: string): v is ReferenceString<string, '..'> {
  if (v.startsWith('..')) return true
  if (v.startsWith('=..')) return true
  return false
}

export function reference(v: unknown): v is ReferenceString {
  if (str(v)) {
    if (v === '.yml') return false
    if (v.startsWith('.')) return true
    if (v.startsWith('=')) return true
    if (v.startsWith('@')) return true
    if (v.startsWith('~/')) return true
    if (/^[_]+\./.test(v)) return true
    return false
  }
  return false
}

/**
 * true: "."
 * true: "=."
 * false: "=.."
 * false: ".."
 */
export function rootReference(v: string): v is ReferenceString<string, '.'> {
  if (v.startsWith('..')) return false
  if (v.startsWith('=..')) return false
  if (v.startsWith('.') && v[1].toUpperCase() === v[1]) return true
  if (v.startsWith('=.') && v[2].toUpperCase() === v[2]) return true
  return false
}

/**
 * Returns true if the value is prefixed with ~/ (placeholder for base url)
 * true: "~/myBaseUrl"
 * false: "/myBaseUrl"
 * false: "myBaseUrl"
 * false: "~myBaseUrl"
 * @param v Reference string
 * @returns { boolean }
 */
export function tildeReference(v: string): v is ReferenceString<string, '~/'> {
  return v.startsWith('~/')
}

/**
 * True if the value is prefixed with N underscores followed by a single dot
 * ex: _____.abc
 * ex: _.SignIn.formData.password
 * @param v Reference string
 * @returns { boolean }
 */
export function traverseReference(v: string) {
  return /^[_]+\./.test(v)
}

export function rootKey(v: string) {
  return !!(v && v[0].toUpperCase() === v[0] && !regex.numbers.test(v))
}

/** @internal */
export function fnc<
  F extends (...args: any[]) => any = (...args: any[]) => any,
>(v: any): v is F {
  return typeof v === 'function'
}

/** @internal */
export function nil(v: any) {
  return v === null || und(v)
}

export function nullishStyleValue(v: unknown) {
  return nil(v) || v === '0px' || v == '0' || v == 'auto' || v == 'none'
}

/** @internal */
export function num(v: any): v is number {
  return typeof v === 'number'
}

/**
 * If this returns true, the value is something like "0.2", "0.4", etc.
 * Whole numbers like "1" or "5" will return false, which is not what we want for positioning values like "marginTop" or "top" since we assume "1" means full screen, etc.
 */
export function noodlUnit(value: unknown): value is string {
  return str(value) && !/[a-zA-Z]/i.test(value) && (value as any) % 1 !== 0
}

export function pageComponentUrl(value: unknown) {
  if (!str(value)) return false
  const match = value.match(/@|#/g)
  if (match) return ['@', '#'].every((op) => match.includes(op))
  return false
}

export function promise<V = any>(value: unknown): value is Promise<V> {
  return obj(value) && 'then' in value
}

export function root(value: unknown): value is ARoot {
  return (
    value !== null &&
    typeof value === 'object' &&
    value['_id_'] === c._symbol.root
  )
}

/** @internal */
export function und(v: unknown): v is undefined {
  return typeof v === 'undefined'
}

export function vwVh(value: unknown): value is `${string}${'vh' | 'vw'}` {
  return str(value) && (value.endsWith('vw') || value.endsWith('vh'))
}

export function vw(v: unknown): v is `${string}vw` {
  return str(v) && v.endsWith('vw')
}

export function vh(v: unknown): v is `${string}vh` {
  return str(v) && v.endsWith('vh')
}

export function keyRelatedToWidthOrHeight(key: number | string | symbol) {
  if (!str(key)) return false
  return [keyRelatedToHeight, keyRelatedToWidth].some((fn) => fn(key))
}

export function keyRelatedToHeight(key: number | string | symbol) {
  return [...c.vpHeightKeys, 'center', 'centerY'].includes(key as any)
}

export function keyRelatedToWidth(key: number | string | symbol) {
  return [...c.vpWidthKeys, 'centerX', 'right'].includes(key as any)
}

export function validViewport(value: unknown): value is IViewport {
  return (
    obj(value) &&
    ('width' in value || 'height' in value) &&
    num(value.width || num(value.height))
  )
}
