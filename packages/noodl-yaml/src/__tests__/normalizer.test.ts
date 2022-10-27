import { expect } from 'chai'
import sinon from 'sinon'
import y from 'yaml'
import { consts, fp, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import { toYml } from '../utils/yaml'
import { factory } from '../factory'
import { ActionChain } from '../machine/action-chain'
import { createProducer, createEmitter } from '../machine'
import { resolve as _resolve } from './resolve'
import { Key } from '../machine/key'
import get from '../utils/get'
import has from '../utils/has'
import set from 'lodash/set'
import unset from 'lodash/unset'
import unwrap from '../utils/unwrap'
import { createNormalizer } from '../normalizer'
import { ui } from './test-utils'
import * as c from '../constants'

let normalize: ReturnType<typeof createNormalizer>

beforeEach(() => {
  normalize = createNormalizer({
    assign: (node, ...rest) => {
      console.log(`assign: `, { node, rest })

      if (y.isDocument(node)) node = node.contents
      if (y.isMap(node)) {
        for (const o of rest) {
          if (y.isDocument(o)) o = o.contents
          if (y.isMap(o)) {
            o.items.forEach((pair) => {
              node.set(pair.key, pair.value)
            })
          }
        }
      }
      return node
    },
    // entries: (node) => {
    //   const entries = [] as [unknown, unknown][]
    //   if (y.isDocument(node)) node = node.contents
    //   if (y.isMap(node)) {
    //     node.items.forEach((pair) => {
    //       entries.push([String(pair.key), pair.value])
    //     })
    //   }
    //   return entries
    // },
    isArr: (node) => y.isSeq(node),
    isObj: (node) => y.isMap(node),
    isStr: (node) => is.stringNode(node),
    isNum: (node) => is.numberNode(node),
    isNil: (node) => is.nilNode(node),
    isUnd: (node) => is.undefinedNode(node),
    get: (node, key) => {
      console.log(`[get]`, { node, key })
      if (y.isScalar(key)) key = key.value
      if (y.isCollection(node)) return node.getIn(fp.toPath(key), true)
      if (y.isScalar(node)) return node
      if (y.isDocument(node)) return node.getIn(fp.toPath(key), true)
      if (coreIs.obj(node)) return node[key]
    },
    set: (node, key, value) => {
      console.log(`[set]`, { node, key, value })

      if (y.isScalar(key)) key = key.value
      if (y.isCollection(node)) node.setIn(fp.toPath(key), value)
      else if (y.isDocument(node)) node.setIn(fp.toPath(key), value)
      else if (y.isPair(node)) node.value = value
      else if (coreIs.obj(node)) node[key] = value
      return node
    },
    unset: (node, key) => {
      if (y.isScalar(key)) key = key.value
      if (y.isCollection(node)) node.deleteIn(fp.toPath(key))
      else if (y.isDocument(node)) node.deleteIn(fp.toPath(key))
      else if (y.isPair(node)) node.value = null
    },
    toArr: (node) => {
      let seqNode
      if (y.isSeq(node)) {
        seqNode = node
      } else {
        seqNode = new y.YAMLSeq()
        if (coreIs.arr(node)) node.forEach((n) => seqNode.add(n))
        else seqNode.add(node)
      }
      return seqNode
    },
  })
})

describe.only(`normalizer`, () => {
  it(``, () => {
    const component = ui.image({
      path: 'abc.png',
      style: {
        top: '0.1',
        textAlign: { x: 'centerX', y: 'center' },
        border: { style: '3' },
        isHidden: 'false',
        shadow: 'true',
      },
      viewTag: 'abcTag',
    })
    const normalized = normalize(component)
    console.dir(normalized.toJSON(), { depth: Infinity })
  })
})
