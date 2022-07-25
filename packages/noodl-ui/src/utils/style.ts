import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { StyleObject, VpUnit, VpValue } from 'noodl-types'
import { hasDecimal, hasLetter } from './common'
import type NuiViewport from '../Viewport'
import * as t from '../types'

export const xKeys = <const>['width', 'left']
export const yKeys = <const>['height', 'top', 'marginTop']
export const posKeys = <const>[...xKeys, ...yKeys]
// Style keys that map their values relative to the viewport's height
export const vpHeightKeys = <const>[
  ...yKeys,
  'borderRadius',
  'fontSize',
  'paddingTop',
  'paddingBottom',
  'marginBottom',
]
export const vpWidthKeys = <const>[
  ...xKeys,
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
]

export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
] as const

export function getPositionProps(
  styleObj: StyleObject | undefined,
  key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
  viewportSize: number,
) {
  if (!styleObj) return
  const value = styleObj?.[key]
  // String
  if (u.isStr(value)) {
    if (value == '0') return { [key]: '0px' }
    if (value == '1') return { [key]: `${viewportSize}px` }
    if (!hasLetter(value)) {
      return { [key]: getViewportRatio(viewportSize, value) + 'px' }
    }
  }
  // Number
  else if (hasDecimal(styleObj?.[key]))
    return { [key]: getViewportRatio(viewportSize, value) + 'px' }

  return undefined
}

// TODO - Deprecate this in favor of Viewport.getSize
/**
 * Takes a value and a full viewport size and returns a computed value in px
 * @param { string | number } value - width / height value
 * @param { number } viewportSize
 */
export function getSize(value: string | number, viewportSize: number) {
  if (value == '0') return '0px'
  if (value == '1') return `${viewportSize}px`
  if (u.isStr(value)) {
    if (!hasLetter(value)) return `${Number(value) * viewportSize}px`
    // Assuming it already has a 'px' appended
    return value
  }
  if (isFinite(value)) {
    if (hasDecimal(value)) return `${value * viewportSize}px`
    return `${value}px`
  }
  return value
}

/**
 * Returns a ratio (in pixels) computed from a total given viewport size
 * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
 * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
 */
export function getViewportRatio(viewportSize: number, size: string | number) {
  if (u.isStr(size) || u.isNum(size)) {
    return viewportSize * Number(size)
  }
  return viewportSize
}

/**
 * Returns viewport.width or viewport.height, or null is viewport is invalid
 * @param viewport
 * @param value
 * @returns
 */
export function getViewportBound(
  viewport: t.ViewportObject | NuiViewport | null | undefined,
  value: LiteralUnion<Parameters<typeof getVpKey>[0], string>,
) {
  const vpKey = getVpKey(value as any)
  if (vpKey !== null && isValidViewport(viewport)) return viewport[vpKey]
  return null
}

export function getVpKey(
  value:
    | VpValue
    | (
        | typeof vpHeightKeys[number]
        | typeof vpWidthKeys[number]
        | typeof textAlignStrings[number]
      ),
) {
  if (isVw(value) || isKeyRelatedToWidth(value)) return 'width'
  if (isVh(value) || isKeyRelatedToHeight(value)) return 'height'
  return 'height'
}

/**
 * If this returns true, the value is something like "0.2", "0.4", etc.
 * Whole numbers like "1" or "5" will return false, which is not what we want for positioning values like "marginTop" or "top" since we assume "1" means full screen, etc.
 */
export function isNoodlUnit(value: unknown): value is string {
  return u.isStr(value) && !/[a-zA-Z]/i.test(value) && (value as any) % 1 !== 0
}

export function toFixed(value: number, fixNum?: number) {
  return u.isNum(fixNum) ? value.toFixed(fixNum) : value
}

export function toFixedNum(value: string | number, fixNum?: number) {
  return toFixed(toNum(value), fixNum)
}

export function isVwVh(value: unknown): value is `${string}${'vw' | 'vh'}` {
  return u.isStr(value) && (value.endsWith('vw') || value.endsWith('vh'))
}

export function isVw(v: unknown): v is `${string}vw` {
  return u.isStr(v) && v.endsWith('vw')
}

export function isVh(v: unknown): v is `${string}vh` {
  return u.isStr(v) && v.endsWith('vh')
}

export function isKeyRelatedToWidthOrHeight(key: string) {
  return [isKeyRelatedToHeight, isKeyRelatedToWidth].some((fn) => fn(key))
}

export function isKeyRelatedToHeight(key: string) {
  return [...vpHeightKeys, 'center', 'centerY'].includes(key)
}

export function isKeyRelatedToWidth(key: string) {
  return [...vpWidthKeys, 'centerX', 'right'].includes(key)
}

export function isValidViewport(
  value: unknown,
): value is NuiViewport | t.ViewportObject {
  return (
    u.isObj(value) &&
    ('width' in value || 'height' in value) &&
    u.isNum(value.width || u.isNum(value.height))
  )
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 */
export function toNum(value: unknown, fixedNum?: number) {
  if (u.isNum(value)) return Number(toFixed(Number(value), fixedNum))
  else if (u.isStr(value)) {
    return Number(toFixed(Number(value.replace(/[a-zA-Z]/gi, '')), fixedNum))
  }
  return Number(value)
}

/**
 * @param { number | null } vpSize
 * @param { string | number } value
 * @param { VpUnit } unit
 * @returns { string }
 */
export function toVwVh(
  vpSize: number | null,
  value: string | number,
  unit: VpUnit,
) {
  if (vpSize == null) return value as number
  const num = toNum(value)
  if (!Number.isNaN(num)) {
    return `${100 * (num / vpSize)}${unit}`
  }
  return value
}

/**
 * Convers the value into the vw/vh format
 * @param { number } vpSize
 * @param { string | number } px
 * @returns { number }
 */
export function toVp(
  unit: VpUnit,
  vpSize: number,
  px: string | number,
): VpValue {
  if (u.isStr(px)) px = toNum(px)
  return `${px * (100 / vpSize)}${unit}`
}

export const pxToVw = (vpSize: number, px: string | number) =>
  toVp('vw', vpSize, px) as `${string}vw`

export const pxToVh = (vpSize: number, px: string | number) =>
  toVp('vh', vpSize, px) as `${string}vh`
