import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import type { Pair } from 'yaml'
import {
  isNode,
  isScalar,
  isPair,
  isMap,
  isSeq,
  isDocument,
  toNode,
} from './yml'
import regex from '../internal/regex'
import type { NoodlYAMLNode, YAMLNode } from '../types'
/**
 * @example
 * ```js
 * const placeholder = '${cadlversion}'
 * const value = 'abc123.41'
 * const str = 'http://public.aitmed.com/cadl/www${cadlVersion}${designSuffix}/'
 *
 * const result = replacePlaceholder(placeholder, value, str)
 *
 * console.log(result) // Result: 'https://public.aitmed.com/cadl/wwwabc123.41${designSuffix}/'
 * ```
 */
export const replacePlaceholder = curry(
  (placeholder: string, value: any, str: string) => {
    return str.replace(placeholder, value)
  },
)

export function replacePlaceholders<
  O extends YAMLNode | Record<string, any> | undefined,
>(
  regexOrObjs: RegExp | O | O[],
  objsProp:
    | string
    | YAMLNode
    | Record<string, any>
    | (YAMLNode | Record<string, any>)[]
    | undefined,
  valueProp?: unknown,
) {
  let rx: RegExp
  let objs: O | O[] | undefined
  let value: any

  if (regexOrObjs instanceof RegExp) {
    rx = regexOrObjs
    objs = objsProp as O | O[]
    value = valueProp
  } else {
    rx = regex.templateLiteralPlaceholder
    objs = regexOrObjs
    value = valueProp
  }

  if (!objs) return objs

  for (const obj of u.array(objs)) {
    if (obj) {
      if (!isNode(obj) && !isPair(obj)) {
        if (u.isObj(obj)) {
          for (const [key, val] of u.entries(obj)) {
            if (u.isStr(val)) {
              if (rx.test(val)) {
                obj[key as any] = replacePlaceholders(rx, val, value)
              }
            } else if (u.isArr(val)) {
              val.forEach((v) => replacePlaceholders(rx, v, valueProp))
            } else if (u.isObj(val)) {
              replacePlaceholders(rx, val, valueProp)
            }
          }
        }
      } else {
        let node = (isPair(obj) ? obj.value : obj) as Exclude<YAMLNode, Pair>

        if (isDocument(node) && node.contents) {
          node = node.contents
        }

        if (node) {
          if (isScalar(node)) {
            if (u.isStr(node.value)) {
              if (rx.test(node.value)) {
                // REPLACE STRING
                node.value = node.value.replace(rx, value)
              }
            }
          } else if (isMap(node)) {
            node.items.forEach((pair) => {
              pair.value = replacePlaceholders(rx, pair.value, valueProp)
            })
          } else if (isSeq(node)) {
            const seqNode = node
            seqNode.items.forEach((item, index) => {
              seqNode.set(index, replacePlaceholders(rx, item, valueProp))
            })
          }
        }
      }
    }
  }

  return objs
}
