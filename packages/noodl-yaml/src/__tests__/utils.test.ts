import { expect } from 'chai'
import curry from 'lodash/curry'
import sinon from 'sinon'
import m from 'noodl-test-utils'
import y from 'yaml'
import { findPair, mapTag } from 'yaml/util'
import { consts, fp, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import { toYml } from '../utils/yaml'
import { factory } from '../factory'
import { createProducer, createEmitter } from '../machine'
import { resolve as _resolve } from './resolve'
import get from '../utils/get'
import set from '../utils/set'
import has from '../utils/has'
import unwrap from '../utils/unwrap'
import * as c from '../constants'

const createNoodlMochaTesters = (node: any) => {
  const getAsNode = curry((node: any, path: any | any[]) => {
    if (y.isCollection(node)) {
      return node.getIn(fp.toPath(path), true)
    }
    return node
  })

  return {
    expectToBeInstanceOf: (
      type: 'Scalar' | 'Pair' | 'Map' | 'Seq' | 'Doc',
      value = node,
    ) => {
      const assertion = expect(value).to.be.instanceOf(
        (function () {
          switch (type) {
            case 'Scalar':
              return y.Scalar
            case 'Pair':
              return y.Pair
            case 'Map':
              return y.YAMLMap
            case 'Seq':
              return y.YAMLSeq
            case 'Doc':
              return y.Document
          }
        })(),
      )

      return {
        toHaveValue: (key: string) => assertion.to.have.property('value', key),
      }
    },
    get: (path: string) => getAsNode(node, path),
  }
}

describe(`utils`, () => {
  describe(`createNode`, () => {
    it(`should deeply create nodes`, () => {
      const component = m.image({
        path: 'abc.png',
        style: {
          top: '0.1',
          textAlign: { x: 'centerX', y: 'center' },
          border: { style: '3' },
          isHidden: 'false',
        },
        viewTag: 'abcTag',
        if: [{}, [{ hello: 'goodbye' }], null],
      })
      const node = createNode(component)
      const t = createNoodlMochaTesters(node)
      t.expectToBeInstanceOf('Scalar', t.get('path')).toHaveValue('abc.png')
      t.expectToBeInstanceOf('Map', t.get('style'))
      t.expectToBeInstanceOf('Scalar', t.get('style.top')).toHaveValue('0.1')
      t.expectToBeInstanceOf('Scalar', t.get('style.isHidden')).toHaveValue(
        'false',
      )
      t.expectToBeInstanceOf('Map', t.get('style.textAlign'))
      t.expectToBeInstanceOf('Scalar', t.get('style.textAlign.x')).toHaveValue(
        'centerX',
      )
      t.expectToBeInstanceOf('Scalar', t.get('style.textAlign.y')).toHaveValue(
        'center',
      )
      t.expectToBeInstanceOf('Scalar', t.get('style.border.style')).toHaveValue(
        '3',
      )
      t.expectToBeInstanceOf('Scalar', t.get('viewTag')).toHaveValue('abcTag')
      t.expectToBeInstanceOf('Map', t.get('if.0'))
      t.expectToBeInstanceOf('Seq', t.get('if.1'))
      t.expectToBeInstanceOf('Map', t.get('if.1.0'))
      t.expectToBeInstanceOf('Scalar', t.get('if.1.0.hello'))
      t.expectToBeInstanceOf('Scalar', t.get('if.2'))
    })
  })

  describe(`set`, () => {
    it(`[Scalar] should set the value`, () => {
      const node = createNode('hello')
      set(node, 'bye')
      expect(node.value).to.eq('bye')
    })

    it(`[Pair] should set the value`, () => {
      const node = createNode('greeting', 'hello')
      set(node, 'bye')
      expect(node)
        .to.have.property('value')
        .to.be.instanceOf(y.Scalar)
        .to.have.property('value', 'bye')
    })

    it(`[YAMLMap] should set the value on the key`, () => {
      const obj = {
        type: 'image',
        path: { emit: { dataKey: '$var', actions: [] } },
      }
      const node = createNode(obj)
      expect(node.has('style')).to.be.false
      set(node, 'style', { top: '0.2' })
      expect(node.has('style')).to.be.true
      expect(node).to.be.instanceOf(y.YAMLMap)
      expect(node.hasIn(['style', 'top'])).to.be.true
    })

    it(`[YAMLMap] should deeply set values and create them all as yaml nodes`, () => {
      const obj = {
        type: 'image',
        path: { emit: { dataKey: '$var', actions: [] } },
      }
      const node = createNode(obj)
      set(node, 'style', {
        top: '0.2',
        border: { style: '2', list: [{ fruits: [] }] },
      })
      expect(node.get('style')).to.be.instanceOf(y.YAMLMap)
      expect(node.getIn(['style', 'top'])).eq('0.2')
      expect(node.getIn(['style', 'border'])).be.instanceOf(y.YAMLMap)
      expect(node.getIn(['style', 'border', 'style'])).to.eq('2')
      expect(node.getIn(['style', 'border', 'list'])).to.be.instanceOf(
        y.YAMLSeq,
      )
      expect(
        node.getIn(['style', 'border', 'list', 0, 'fruits']),
      ).to.be.instanceOf(y.YAMLSeq)
    })

    it(`[YAMLSeq] should set the value in the index key`, () => {
      const node = createNode([0, 1, { hello: { fruits: [] } }])
      const fruitsNode = node.getIn([2, 'hello', 'fruits']) as y.YAMLSeq
      expect(fruitsNode).to.be.instanceOf(y.YAMLSeq)
      expect(fruitsNode.items).to.have.lengthOf(0)
      const value = 'Michael'
      set(fruitsNode, 3, value)
      expect(fruitsNode.items).to.have.lengthOf(4)
      expect(fruitsNode.items[3])
        .to.be.instanceOf(y.Scalar)
        .to.have.property('value', value)
    })

    it(`[YAMLSeq] should deeply set values`, () => {
      const path = '0.profile.names.3.main'.split('.')
      const node = createNode([0, 1, { hello: { fruits: [] } }])
      const fruitsNode = node.getIn([2, 'hello', 'fruits']) as y.YAMLSeq
      const datapath = path.join('.')
      set(fruitsNode, datapath, 'Michael')
      expect(fruitsNode.hasIn(path)).to.be.true
      expect(fruitsNode.getIn(path, true))
        .to.be.instanceOf(y.Scalar)
        .to.have.property('value', 'Michael')
    })
  })
})
