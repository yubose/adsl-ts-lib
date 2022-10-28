import chalk from 'chalk'
import { isProxy } from 'is-proxy'
import * as u from '@jsmanifest/utils'
import partial from 'lodash/partial'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import type { ComponentObject } from 'noodl-types'
import y from 'yaml'
import {
  isAnyNode,
  isScalar,
  isPair,
  isCollection,
  isMap,
  isSeq,
  isNode,
  isDoc,
} from './utils/yaml'
import _createNode from './utils/createNode'
import unwrap from './utils/unwrap'
import { fp, is as cis } from 'noodl-core'
import { normalizeProps } from 'noodl-ui'
import * as c from './constants'

const isSymbol = (value: unknown): value is symbol =>
  Object.prototype.toString.call(value) === '[object Symbol]'

const aqua = chalk.keyword('aquamarine')
const gold = chalk.keyword('navajowhite')
const blue = chalk.keyword('royalblue')
const salmon = chalk.keyword('salmon')
const { cyan, magenta, yellow } = u
const label = (colorFn: any, text = '') => `[${colorFn(text)}]`

const whiteLabel = partial(label, chalk.whiteBright)
const goldLabel = partial(label, gold)
const blueLabel = partial(label, blue)
const cyanLabel = partial(label, cyan)
const salmonLabel = partial(label, salmon)
const yellowLabel = partial(label, yellow)
const magentaLabel = partial(label, magenta)

const ra = `${aqua('->')}`
const la = `${aqua('<-')}`

function getNodeLabel(value: unknown) {
  if (isMap(value)) return 'YAMLMap'
  if (isSeq(value)) return 'YAMLSeq'
  if (isDoc(value)) return 'Document'
  if (isScalar(value)) return 'Scalar'
  if (isPair(value)) return 'Pair'
  return '<unknown>'
}

function proxifyPairs(pairs: y.Pair[]) {
  pairs.forEach((pair, index) => {
    pairs[index] = createProxy(pair)
  })
}

function proxifyItems(items: any[]) {
  items.forEach((item, index) => {
    if (isMap(item)) {
      proxifyPairs(item.items)
    } else if (isSeq(item)) {
      proxifyItems(item.items)
    } else if (isScalar(item)) {
      items[index] = createProxy(item)
    }
  })
  return items
}

export function createProxy(component: unknown) {
  // if (isProxy(component)) return component

  let node = _createNode(component) as any

  // if (isMap(node)) {
  //   proxifyPairs(node.items)
  // } else if (isSeq(node)) {
  //   proxifyItems(node.items)
  // } else if (isDoc(node)) {
  //   node.contents = createProxy(node.contents)
  // } else if (isScalar(node)) {
  //   // console.log('HELLO?', node)
  // } else if (isPair(node)) {
  //   node.key = createProxy(node.key)
  //   node.value = createProxy(node.value)
  // }

  let _proxy = new Proxy(node, {
    get(target, p) {
      let key = (cis.symbol(p) ? Symbol.keyFor(p) : p) as string
      console.log(
        `${cyanLabel('get')} (${getNodeLabel(target)}) ${ra} ${magenta(key)}`,
      )

      let isSymb = isSymbol(p)
      let result: any

      if (isSymb) {
        return unwrap(Reflect.get(target, p))
      } else {
        if (p === 'getIn') return Reflect.get(target, p)
        if (p === 'get') return Reflect.get(target, p)
        if (p === 'items') return target.items
        if (p === 'set') return Reflect.get(target, p)
        if (p === 'setIn') return Reflect.get(target, p)
        if (p === 'add') return Reflect.get(target, p)
        if (p === 'schema') return Reflect.get(target, p)
        if (p === 'toJSON') return Reflect.get(target, p)

        if (isCollection(target) || isDoc(target)) {
          result = target.getIn(fp.toPath(p), true)
        } else if (isPair(target)) {
          result = Reflect.get(target, p)
        } else {
          result = target[p]
        }
      }

      let label = getNodeLabel(target)

      console.log(`${cyanLabel('get')} (${label}) ${ra} ${magenta(key)}`, {
        result,
      })

      return result
    },
    has(target, p) {
      let label = getNodeLabel(target)
      let result = false

      if (cis.symbol(p)) return p in target

      if (isCollection(target) || isDoc(target)) {
        result = target.hasIn(fp.toPath(p))
      } else if (u.isStr(p)) {
        result = p in target
      }

      console.log(
        `${yellowLabel('has')} (${label}) "${p}" ${ra} {result} ${label}`,
        result,
      )

      return result
    },
    set(target, p, value) {
      let label = getNodeLabel(target)
      let property = cis.symbol(p) ? Symbol.keyFor(p) : p

      console.log(
        `${salmonLabel('set')} (${label}) ${ra} ${magenta(property as string)}`,
        {
          target,
          value,
        },
      )

      if (isCollection(target) || isDoc(target)) {
        const type = typeof target
        if (
          value != null &&
          ['boolean', 'number', 'string', 'undefined'].includes(type)
        ) {
          value - createProxy(value)
        }
        target.setIn(fp.toPath(p), value)
      } else if (isPair(target)) {
        target[p] = createProxy(value)
      } else {
        target[p] = value
      }

      return true
    },
    // ownKeys(target) {
    //   const keys = Reflect.ownKeys(target)
    //   console.log(`[ownKeys] result for ${getNodeLabel(target)}`, keys)
    //   return keys
    // },
    apply(target, thisArg, argArray) {
      console.log(`[apply]`, [...arguments])
    },
    defineProperty(target, property, attributes) {
      console.log(`[defineProperty]`, [...arguments])
      Object.defineProperty(target, property, attributes)
      return true
    },
    deleteProperty(target, p) {
      console.log(`[target]`, [...arguments])
      delete target[p]
      return true
    },
    // construct(target, argArray, newTarget) {
    //   console.log(`[construct]`, [...arguments])
    //   return newTarget
    // },
    // getOwnPropertyDescriptor(target, p) {
    //   console.log(`[getOwnPropertyDescriptor]`, [...arguments])
    //   return Object.getOwnPropertyDescriptor(target, p)
    // },
    // getPrototypeOf(target) {
    //   console.log(`[target]`, [...arguments])
    //   return target.constructor.prototype
    // },

    // isExtensible(target) {
    //   console.log(`[isExtensible]`, [...arguments])
    //   return true
    // },
    // preventExtensions(target) {
    //   console.log(`[target]`, [...arguments])
    //   return false
    // },

    // setPrototypeOf(target, v) {
    //   console.log(`[setPrototypeOf]`, [...arguments])
    //   target.prototype = v
    //   return true
    // },
  })

  return _proxy
}
