import type { LiteralUnion } from 'type-fest'
import type {
  ReferenceString,
  ReferenceSymbol,
  StyleObject,
  VpUnit,
  VpValue,
} from 'noodl-types'
import {
  arr,
  localKey,
  localReference,
  nil,
  num,
  noodlUnit,
  str,
  validViewport,
  vw,
  vh,
  vwVh,
  keyRelatedToHeight,
  keyRelatedToWidth,
  keyRelatedToWidthOrHeight,
} from './is'
import * as regex from './regex'
import { hasDecimal, toArr, toPath } from './fp'
import type { IViewport } from '../types'
import * as c from '../constants'

export function ensureCssUnit(value: number | string, unit = 'px') {
  if (str(value) && hasLetter(value)) return value
  return `${value}${unit}`
}

export function excludeIteratorVar(iteratorVar: string, key: string) {
  if (str(key)) {
    if (key === iteratorVar) return ''
    if (key.startsWith(iteratorVar)) {
      if (getRefLength(key) > 1) return toPath(key).slice(1).join('.')
      return ''
    }
  }
  return key
}

/**
 * Converts 0x000000 to #000000 format
 * @param { string } value - Raw color value from NOODL
 */
export function formatColor(value: string) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value.replace('0x', '#')
  }
  return value || ''
}

export function getPositionProps(
  styleObj: StyleObject | undefined,
  key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
  viewportSize: number,
) {
  if (!styleObj) return
  const value = styleObj?.[key]
  // String
  if (str(value)) {
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

export function getRefLength(ref: any) {
  return str(ref) ? trimReference(ref).split('.').length : 0
}

export function getRefProps(ref: ReferenceString) {
  const path = trimReference(ref)
  const paths = path.split('.')
  return {
    isLocalRef: localReference(ref),
    isLocalKey: localKey(path),
    paths,
    path,
    ref,
  }
}

export function getNextRootKeyProps(
  currentPaths: string[] | string,
  currentRootKey?: string,
) {
  let paths = toPath(trimReference(toArr(currentPaths).join('.')))
  let rootKey = currentRootKey || ''

  if (paths.length) {
    if (rootKey) {
      if (paths[0] === rootKey) {
        paths.shift()
      }
    } else {
      //
    }
  }

  return { paths, path: paths.join('.'), rootKey }
}

/**
 * Returns the computed size.
 * @param { string | number } value - Size in decimals as written in NOODL
 * @param { number } vpSize - The maximum width (or height)
 */
export function getSize(
  value: number | string,
  vpSize: number,
  {
    toFixed = 2,
    unit = 'px',
  }: { toFixed?: number; unit?: 'noodl' | 'px' } = {},
) {
  let result: any
  if (value == '0') {
    result = 0
  } else if (value == '1') {
    result = Number(vpSize)
  } else {
    if (str(value)) {
      if (!hasLetter(value)) {
        result = Number(value) * vpSize
      } else {
        result = value.replace(/[a-zA-Z]+/gi, '')
      }
    } else if (num(value)) {
      result = hasDecimal(value) ? value * vpSize : value
    }
  }
  if (nil(result)) return result
  switch (unit) {
    // NOODL
    case 'noodl':
      return (Number(result) / vpSize).toFixed(toFixed)
    // Transformed
    case 'px':
      return `${Number(result).toFixed(toFixed)}px`
    default:
      // TODO - Wrap to coerce to number type
      return Number(result).toFixed(toFixed)
  }
}

/**
 * Returns viewport.width or viewport.height, or null is viewport is invalid
 * @param viewport
 * @param value
 * @returns
 */
export function getViewportBound(
  viewport: IViewport | null | undefined,
  value: LiteralUnion<Parameters<typeof getVpKey>[0], string>,
) {
  const vpKey = getVpKey(value as any)
  if (vpKey !== null && validViewport(viewport)) return viewport[vpKey]
  return null
}

/**
 * Returns a ratio (in pixels) computed from a total given viewport size
 * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
 * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
 */
export function getViewportRatio(viewportSize: number, size: number | string) {
  if (str(size) || num(size)) {
    return viewportSize * Number(size)
  }
  return viewportSize
}

export function getVpKey(
  value:
    | VpValue
    | (
        | typeof c.textAlignStrings[number]
        | typeof c.vpHeightKeys[number]
        | typeof c.vpWidthKeys[number]
      ),
) {
  if (vw(value) || keyRelatedToWidth(value)) return 'width'
  if (vh(value) || keyRelatedToHeight(value)) return 'height'
  return 'height'
}

/**
 * Returns true if there is any letter in the string
 * @param { string } value - Value to evaluate
 */
export function hasLetter(value: any): boolean {
  return /[a-zA-Z]/i.test(String(value))
}

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
} as const

export function isValidViewTag(viewTag: unknown) {
  if (str(viewTag)) return !!(viewTag && regex.letters.test(viewTag))
  return false
}

/**
 * @example
 * "0x000000" --> "#000000"
 * "shadow" --> "'5px 5px 10px 3px rgba(0, 0, 0, 0.015)'"
 * "true" --> true
 * "false" --> false
 * ['axis', 'horizontal'] --> { display: 'flex', flexWrap: 'nowrap' }
 * ['axis', 'vertical'] --> { display: 'flex', flexDirection: 'column' }
 * ['align', 'centerX'] --> { display: 'flex', justifyContent: 'center' }
 * ['align', 'centerY'] --> { display: 'flex', alignItems: 'center' }
 * ['textAlign', 'centerX'] --> { textAlign: 'center' }
 * ['textAlign', 'centery'] --> { display: 'flex', alignItems: 'center' }
 * @returns The normalized value
 */
export function normalize(v: any) {
  if (arr(v)) {
    const [key, value] = v
    if (key === 'axis') {
      if (value === 'horizontal') return { display: 'flex', flexWrap: 'nowrap' }
      if (value === 'vertical')
        return { display: 'flex', flexDirection: 'column' }
    }
    if (key === 'align') {
      if (value === 'centerX')
        return { display: 'flex', justifyContent: 'center' }
      if (value === 'centerY') return { display: 'flex', alignItems: 'center' }
    }
    if (key === 'textAlign') {
      if (value === 'centerX') return { textAlign: 'center' }
      else if (value === 'centerY')
        return { display: 'flex', alignItems: 'center' }
    }
    return { [key]: value }
  }
  if (str(v)) {
    if (v.startsWith('0x')) return `#${v.substring(2)}`
    if (v === 'shadow') return '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return v
}

export function parsePageComponentUrl(url: string) {
  const [targetPage = '', _, currentPage = '', __, viewTag = ''] =
    url.split(/(@|#)/)
  return { targetPage, currentPage, viewTag }
}

export function toPageComponentUrl(
  target: string,
  current: string,
  viewTag: string,
) {
  return `${target}@${current}#${viewTag}`
}

/**
 * Trims the reference prefix in the string
 * @param v Reference string
 * @param fixType 'prefix'
 */
export function trimReference(
  v: LiteralUnion<ReferenceString, string>,
  fixType: 'prefix',
): ReferenceString<Exclude<ReferenceSymbol, '@'>>

/**
 * Trims the reference suffix in the string
 * @param v Reference string
 * @param fixType 'suffix'
 */
export function trimReference(
  v: LiteralUnion<ReferenceString, string>,
  fixType: 'suffix',
): ReferenceString<Extract<ReferenceSymbol, '@'>>

/**
 * Trims the both prefix and the suffix symbol(s) in the reference string
 * @param v Reference string
 * @return { string }
 */
export function trimReference(v: LiteralUnion<ReferenceString, string>): string

/**
 * Trims the both prefix and the suffix symbol(s) in the reference string
 * Optionally provide a second parameter with "prefix" to trim only the prefix,
 * and vice versa for the suffix
 *
 * ex: "=.builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "=..builtIn.string.concat" --> "builtIn.string.concat"
 * ex: ".builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "..builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "____.builtIn.string.concat" --> "builtIn.string.concat"
 * ex: "_.builtIn.string.concat" --> "builtIn.string.concat"
 *
 * @param v Reference string
 * @param fixType (Optional) Either "prefix" or "suffix"
 * @returns string
 */
export function trimReference<
  V extends LiteralUnion<ReferenceString, string>,
  F extends 'prefix' | 'suffix',
>(v: LiteralUnion<V, string>, fixType?: F) {
  if (fixType === 'prefix') {
    if (trimReference.regex.prefix.test(v)) {
      return v.replace(trimReference.regex.prefix, '')
    }
    return v
  }

  if (fixType === 'suffix') {
    if (trimReference.regex.suffix.test(v))
      "return v.replace(trimReference.regex.suffix, '')"
    return v
  }

  return (
    v
      .replace(trimReference.regex.prefix, '')
      .replace(trimReference.regex.suffix, '') || ''
  )
}

trimReference.regex = {
  prefix: /^[.=@]+/i,
  suffix: /[.=@]+$/i,
}
