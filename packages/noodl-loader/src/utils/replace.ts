import { fp, is as coreIs } from 'noodl-core'
import curry from 'lodash/curry'
import type { Pair } from 'yaml'
import { isNode, isScalar, isPair, isMap, isSeq, isDocument } from './yml'
import regex from '../internal/regex'
import type { YAMLNode } from '../types'

/**
 * @example
 * ```js
 * const key = '${cadlversion}'
 * const value = 'abc123.41'
 * const str = 'http://public.aitmed.com/cadl/www${cadlVersion}${designSuffix}/'
 *
 * const result = replacePlaceholder(key, value, str)
 *
 * console.log(result) // Result: 'https://public.aitmed.com/cadl/wwwabc123.41${designSuffix}/'
 * ```
 */
export const replacePlaceholder = curry(
  (key: string, value: any, str: string) => {
    return str.replace(key, value)
  },
)

/**
 * @param regex Regular expression to match in string
 * @param objects Objects seeking to replace placeholders
 * @param values Value(s) replacing matching placeholders
 */
export function replacePlaceholders<
  O extends YAMLNode | Record<string, any> | string | undefined,
>(regex: RegExp, objects: O | O[], values?: any): O extends any[] ? O : O

/**
 * @param objects Objects seeking to replace placeholders
 * @param values Value(s) replacing matching placeholders
 */
export function replacePlaceholders<
  O extends YAMLNode | Record<string, any> | string | undefined,
>(objects: O | O[], values?: any): O extends any[] ? O : O

export function replacePlaceholders<
  O extends YAMLNode | Record<string, any> | string | undefined,
>(
  /**
   * Regular expression or target objects to replace placeholders from
   */
  regexOrObjs: RegExp | O | O[],
  /**
   * Object(s) to replace placeholders from or
   */
  objsOrValues: O | O[],
  valuesProp?: unknown,
) {
  let rx: RegExp
  let objs: O | O[] | undefined
  let values: any

  if (regexOrObjs instanceof RegExp) {
    rx = regexOrObjs
    objs = objsOrValues as O | O[]
    values = valuesProp
  } else {
    rx = regex.placeholder
    objs = regexOrObjs
    values = objsOrValues
  }

  if (!objs) return objs

  const isReplaceable = (value: unknown) => {
    if (!value) return false
    if (coreIs.str(value) && rx.test(value)) return true
    if (coreIs.arr(value) || coreIs.obj(value)) return true
    if (isNode(value)) {
      if (isScalar(value)) {
        return coreIs.str(value.value) && rx.test(value.value)
      }
      return true
    }
    return false
  }

  const replaceString = (str: string, obj: Record<string, any>) => {
    for (const [key, value] of fp.entries(obj)) {
      const placeholder = '$' + '{' + key + '}'
      if (str.includes(placeholder)) {
        str = str.replace(placeholder, value)
      }
    }
    return str
  }

  if (coreIs.str(objs)) {
    if (rx.test(objs)) return replaceString(objs, values)
    return objs
  }

  if (coreIs.arr(objs)) {
    objs.forEach((obj, index) => {
      if (objs) objs[index] = replacePlaceholders(rx, obj, values)
    })
    return objs
  }

  if (isNode(objs) || isPair(objs)) {
    let node = (isPair(objs) ? objs.value : objs) as Exclude<YAMLNode, Pair>

    if (isDocument(node) && node.contents) {
      node = node.contents
    }

    if (node) {
      if (isScalar(node)) {
        if (isReplaceable(node.value)) {
          node.value = replacePlaceholders(rx, node.value, values)
        }
      } else if (isMap(node)) {
        node.items.forEach((pair) => {
          if (isReplaceable(pair.value)) {
            pair.value = replacePlaceholders(rx, pair.value, values)
          }
        })
      } else if (isSeq(node)) {
        const seqNode = node
        seqNode.items.forEach((item, index) => {
          if (isReplaceable(item)) {
            seqNode.set(index, replacePlaceholders(rx, item, values))
          }
        })
      }
    }

    return objs
  }

  if (coreIs.obj(objs)) {
    for (const [key, value] of fp.entries(objs)) {
      if (isReplaceable(value)) {
        objs[key] = replacePlaceholders(rx, value, values)
      } else if (coreIs.arr(value)) {
        value.forEach((v, i) => {
          if (isReplaceable(v)) {
            value[i] = replacePlaceholders(rx, v, values)
          }
        })
      }
    }
  }

  return objs
}
