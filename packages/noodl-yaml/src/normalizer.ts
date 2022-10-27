import * as u from '@jsmanifest/utils'
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
import createNode from './utils/createNode'
import unwrap from './utils/unwrap'
import { fp, is as cis } from 'noodl-core'
import { normalizeProps } from 'noodl-ui'
import * as c from './constants'

const isSymbol = (value: unknown): value is symbol =>
  Object.prototype.toString.call(value) === '[object Symbol]'

function getNodeLabel(value: unknown) {
  if (isMap(value)) return 'YAMLMap'
  if (isSeq(value)) return 'YAMLSeq'
  if (isDoc(value)) return 'Document'
  if (isScalar(value)) return 'Scalar'
  if (isPair(value)) return 'Pair'
  return '<unknown>'
}

export function createNormalizer(options) {
  function _proxifyPairs(pairs: y.Pair[]) {
    pairs.forEach((pair, index) => {
      pairs[index] = _createProxy(pair)
    })
  }

  function _proxifyItems(items: any[]) {
    items.forEach((item, index) => {
      if (isMap(item)) {
        _proxifyPairs(item.items)
      } else if (isSeq(item)) {
        _proxifyItems(item.items)
      } else if (isScalar(item)) {
        items[index] = _createProxy(item)
      }
    })
    return items
  }

  function _createProxy(component: ComponentObject) {
    let node = createNode(component) as any

    if (isMap(node)) {
      _proxifyPairs(node.items)
    } else if (isSeq(node)) {
      _proxifyItems(node.items)
    } else if (isDoc(node)) {
      node.contents = _createProxy(node.contents)
    } else if (isScalar(node)) {
      // console.log('HELLO?', node)
    } else if (isPair(node)) {
      node.key = _createProxy(node.key)
      node.value = _createProxy(node.value)
    }

    let _proxy = new Proxy(node, {
      get(target, p, receiver) {
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

          if (p === 'blueprint') return target.get('blueprint')

          if (isCollection(target) || isDoc(target)) {
            result = Reflect.get(target, p)
          } else {
            result = Reflect.get(target, p)
          }
        }

        console.log(
          `[get] property "${p}" result for ${getNodeLabel(target)}`,
          { result },
        )

        if (isScalar(result)) {
          result = result.value
        } else {
          console.log(`Returning last condition result for [get]`, { result })
        }

        return result
      },
      has(target, p) {
        let result = false
        if (isCollection(target) || isDoc(target)) {
          result = target.hasIn(fp.toPath(p))
        } else {
          result = has(target, p)
        }
        console.log(`[has] "${p}" -> ${result} (${getNodeLabel(target)})`)
        return result
      },
      set(target, p, newValue, receiver) {
        console.log(`[set]`, { target, key: p, value: newValue })

        if (isCollection(target) || isDoc(target)) {
          if (cis.str(p) && !p.includes('.')) {
            target.set(p, _createProxy(newValue))
          } else {
            target.setIn(fp.toPath(p), _createProxy(newValue))
          }
        } else if (isPair(target)) {
          target[p] = _createProxy(newValue)
        } else {
          target[p] = newValue
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

  return (node: any) => {
    // node = _createProxy(node)
    // const propsNode = _createProxy({ style: {} })
    // propsNode.set('style', _createProxy(propsNode.get('style')))
    // Object.defineProperty(propsNode, c._symbol.propsNode, {
    //   configurable: false,
    //   enumerable: true,
    //   value: true,
    // })
    const result = normalizeProps(createNode({}), createNode(node), options)

    console.log(`[Normalized] result`, result)

    return result
  }
}
