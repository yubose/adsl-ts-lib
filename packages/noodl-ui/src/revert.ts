/**
 * Reverse-transform props
 */
import * as u from '@jsmanifest/utils'
import NuiViewport from './Viewport'
import { getVpKey, vpHeightKeys, vpWidthKeys } from './utils/style'

const regex = {
  vpKeys: new RegExp(
    [...new Set([...vpHeightKeys, ...vpWidthKeys])].join('|'),
    'i',
  ),
  vpFloatKeys: new RegExp(`(borderWidth|borderRadius|fontSize)`, 'i'),
} as const

const toNum = NuiViewport.toNum

function revert(props: [string, any] | Record<string, any>, options?: any) {
  if (u.isArr(props)) {
    if (props.length === 2) {
      let [key, value] = props
      let { viewport } = options || {}

      if (regex.vpKeys.test(key) || key === 'borderWidth') {
        if (viewport) {
          if (regex.vpFloatKeys.test(key)) {
            return Number(
              (parseFloat(value) * 100) / viewport?.[getVpKey(key as any)] || 1,
            ).toFixed(2)
          } else {
            return String(
              Number(
                `${toNum(value) / (viewport?.[getVpKey(key as any)] || 0)}`,
              ).toFixed(2),
            )
          }
        }

        return value
      }

      if (value === true) return 'true'
      if (value === false) return 'false'

      if (u.isStr(value)) {
        if (value.startsWith('#')) return value.replace('#', '0x')
        if (value === '5px 5px 10px 3px rgba(0, 0, 0, 0.015)') return 'true'
      }
    }

    return props[1]
  } else if (u.isObj(props)) {
    for (const [key, value] of u.entries(props)) {
      if (key === 'style') {
        if (!u.isObj(value)) continue

        for (const [styleKey, styleValue] of u.entries(value)) {
          if (
            styleKey === 'boxShadow' &&
            styleValue === '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
          ) {
            props.style.shadow = revert([styleKey, styleValue])
            delete props.style.boxShadow
          } else if (styleKey === 'color') {
            props.style.textColor = revert([styleKey, styleValue])
            delete props.style.color
          } else {
            if (u.isStr(styleValue)) {
              if (styleValue.startsWith('#')) {
                props.style[styleKey] = revert([styleKey, styleValue])
              } else if (styleValue.endsWith('px')) {
                props.style[styleKey] = revert([styleKey, styleValue], options)
              }
            }
          }
        }
      }
    }
  }

  return props
}

export default revert
