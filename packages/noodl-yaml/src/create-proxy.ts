import { isProxy } from 'is-proxy'
import * as u from '@jsmanifest/utils'
import unset from 'lodash/unset'
import y from 'yaml'
import { fp } from 'noodl-core'
import {
  isScalar,
  isPair,
  isCollection,
  isMap,
  isSeq,
  isDoc,
} from './utils/yaml'
import _createNode from './utils/createNode'
import unwrap from './utils/unwrap'
import * as c from './constants'

const isSymbol = (value: unknown): value is symbol =>
  Object.prototype.toString.call(value) === '[object Symbol]'

const { blue, cyan, green, magenta, red } = u
const log = console.log

const label = {
  default: (n: any) => `(${getNodeLabel(n)})`,
  children: `<childrenProxy>`,
}

const toggleLog = {
  has: false,
  get: false,
  set: false,
  del: false,
}

const tag = {
  get: `[${cyan('get')}]`,
  set: `[${green('set')}]`,
  del: `[${red('del')}]`,
  has: `[${blue('has')}]`,
}

const ra = `${blue('->')}`

function getNodeLabel(value: unknown) {
  if (isMap(value)) return 'YAMLMap'
  if (isSeq(value)) return 'YAMLSeq'
  if (isDoc(value)) return 'Document'
  if (isScalar(value)) return 'Scalar'
  if (isPair(value)) return 'Pair'
  return '<unknown>'
}

function unwrapScalar(node: unknown) {
  if (isScalar(node)) return node.value
  return node
}

function _proxyHas({ pre, post }: ProxyProcessHandlers = {}) {
  return function onHas(target: any, key: any) {
    let result = false

    pre?.({ type: c.ProxyHandlerType.Has, target, key })

    if (isSymbol(key)) return key in target
    if (isCollection(target) || isDoc(target)) {
      result = target.hasIn(fp.toPath(key))
    } else if (u.isStr(key)) {
      result = key in target
    }

    post?.({ type: c.ProxyHandlerType.Has, target, key, value: result })

    return result
  }
}

function _proxyGetter({
  pre,
  post,
}: ProxyProcessHandlers = {}): ProxyHandler<any>['get'] {
  return function onGet(target, p) {
    let isSymb = isSymbol(p)
    let key = (isSymb ? Symbol.keyFor(p as symbol) : p) as string
    let result: any

    pre?.({ type: c.ProxyHandlerType.Get, key, target })

    if (isSymb) {
      return unwrap(Reflect.get(target, p))
    } else if (u.isNum(p)) {
      log(`${tag.get} {num}`, { target, property: p, key })
    } else {
      if (u.isStr(p)) {
        if (p === 'children') {
          const children = createChildrenProxy(target)
          target.set('children', children)
          return children
        }

        if (p === 'items') {
          return Reflect.get(target, p)
        }

        if (
          /add|delete|deleteIn|get|getIn|has|hasIn|items|set|setIn|schema|toJSON/.test(
            p,
          )
        ) {
          return Reflect.get(target, p)
        }
      }

      if (isCollection(target) || isDoc(target)) {
        if (isSeq(target)) {
          result = target.get(p, true)
          return unwrapScalar(isProxy(result) ? result : createProxy(result))
        }
        result = target.getIn(fp.toPath(p), true)
      } else if (isPair(target)) {
        result = Reflect.get(target, p)
      } else {
        result = target[p]
      }
    }

    post?.({ type: c.ProxyHandlerType.Get, target, key, value: result })

    return unwrapScalar(result)
  }
}

function _proxySetter({ pre, post }: ProxyProcessHandlers) {
  return function onSet(target: any, p: string | symbol, value: any) {
    const key = isSymbol(p) ? Symbol.keyFor(p) : p

    pre?.({ type: c.ProxyHandlerType.Set, target, key, value })

    if (!isProxy(value)) value = createProxy(value)

    if (key === 'items') {
      return true
    } else if (isCollection(target) || isDoc(target)) {
      target.setIn(fp.toPath(p), createProxy(value))
    } else if (isPair(target)) {
      target[p] = createProxy(value)
    } else if (isScalar(target)) {
      target.value = createProxy(value)
    } else {
      target[p] = value
    }

    post?.({ type: c.ProxyHandlerType.Set, target, key, value })

    return true
  }
}

function _proxyDeleter({ pre, post }: ProxyProcessHandlers = {}) {
  return function onDelete(target: any, key: any) {
    pre?.({ type: c.ProxyHandlerType.Del, target, key })

    if (isCollection(target) || isDoc(target)) {
      target.deleteIn(fp.toPath(key))
    } else {
      unset(target, key)
    }

    post?.({ type: c.ProxyHandlerType.Del, target, key })

    return true
  }
}

function _getInternalPrePostHandlers(label: string) {
  return {
    has: {
      pre: ({ key, value: result }) =>
        toggleLog.has && log(`${tag.has} ${label} ${ra} "${key}"`, result),
      post: ({ key, value: result }) =>
        toggleLog.has && log(`${tag.has} ${label} ${ra} "${key}"`, result),
    } as ProxyProcessHandlers,
    get: {
      pre: ({ target, key }) =>
        toggleLog.get && log(`${tag.get} ${label}`, { target, key }),
      post: (_: any, __: any, result: any) =>
        toggleLog.get && log(`${tag.get}${label} ${ra}`, result),
    } as ProxyProcessHandlers,
    set: {
      pre: ({ target, key, value }) =>
        toggleLog.set && log(`${tag.set} ${label}`, { target, key, value }),
      post: ({ target, key, value }) =>
        toggleLog.set && log(`${tag.set} ${label}`, { target, key, value }),
    } as ProxyProcessHandlers,
    del: {
      pre: ({ key }) =>
        toggleLog.del &&
        log(`${tag.del}${label} ${ra} ${magenta(key as string)}`),
      post: ({ key }) =>
        toggleLog.del &&
        log(`${tag.del}${label} ${ra} ${magenta(key as string)}`),
    } as ProxyProcessHandlers,
  }
}

function createChildrenProxy(
  node: y.YAMLMap | y.Document,
  { pre = () => {}, post = () => {} }: ProxyProcessHandlers = {},
) {
  let children = node.get('children') as y.YAMLSeq
  let internal = _getInternalPrePostHandlers(label.children)

  if (children !== undefined) {
    children = new Proxy(children as any, {
      has: _proxyHas({
        pre: u.callAll(internal.has.pre as any, pre),
        post: u.callAll(internal.has.post as any, post),
      }),
      get: _proxyGetter({
        pre: u.callAll(internal.get.pre as any, pre),
        post: u.callAll(internal.get.post as any, post),
      }),
      set: _proxySetter({
        pre: u.callAll(internal.set.pre as any, pre),
        post: u.callAll(post),
      }),
      deleteProperty: _proxyDeleter({
        pre: u.callAll(internal.del.pre as any, pre),
        post: u.callAll(internal.del.post as any, post),
      }),
    })
    node.set('children', children)
  }

  return children
}

export interface ProxyProcessHandlers {
  pre?: (opts: {
    type: c.ProxyHandlerType
    target: any
    key: any
    value?: any
  }) => void
  post?: (opts: {
    type: c.ProxyHandlerType
    target: any
    key: any
    value?: any
  }) => void
}

export interface CreateProxyOptions
  extends Partial<Pick<ProxyProcessHandlers, 'pre' | 'post'>> {
  //
}

export function createProxy(
  component: unknown,
  { pre = () => {}, post = () => {} }: CreateProxyOptions = {},
): any {
  if (isProxy(component)) return component
  let node = _createNode(component) as any
  let internal = _getInternalPrePostHandlers(label.default(node))

  return new Proxy(node, {
    has: _proxyHas({
      pre: u.callAll(internal.has.pre as any, pre),
      post: u.callAll(internal.has.post as any, post),
    }),
    get: _proxyGetter({
      pre: u.callAll(internal.get.pre as any, pre),
      post: u.callAll(internal.get.post as any, post),
    }),
    set: _proxySetter({
      pre: u.callAll(internal.set.pre as any, pre),
      post: u.callAll(post),
    }),
    deleteProperty: _proxyDeleter({
      pre: u.callAll(internal.del.pre as any, pre),
      post: u.callAll(internal.del.post as any, post),
    }),
    // apply(target, thisArg, argArray) {
    //   log(`[apply]`, [...arguments])
    // },
    // defineProperty(target, property, attributes) {
    //   log(`[defineProperty]`, [...arguments])
    //   Reflect.defineProperty(target, property, attributes)
    //   return true
    // },
    // ownKeys(target) {
    //   const keys = Reflect.ownKeys(target)
    //   log(`[ownKeys] result for ${getNodeLabel(target)}`, keys)
    //   return keys
    // },
    // construct(target, argArray, newTarget) {
    //   log(`[construct]`, [...arguments])
    //   return newTarget
    // },
    // getOwnPropertyDescriptor(target, p) {
    //   log(`[getOwnPropertyDescriptor]`, [...arguments])
    //   return Object.getOwnPropertyDescriptor(target, p)
    // },
    // getPrototypeOf(target) {
    //   log(`[target]`, [...arguments])
    //   return target.constructor.prototype
    // },

    // isExtensible(target) {
    //   log(`[isExtensible]`, [...arguments])
    //   return true
    // },
    // preventExtensions(target) {
    //   log(`[target]`, [...arguments])
    //   return false
    // },

    // setPrototypeOf(target, v) {
    //   log(`[setPrototypeOf]`, [...arguments])
    //   target.prototype = v
    //   return true
    // },
  })
}
