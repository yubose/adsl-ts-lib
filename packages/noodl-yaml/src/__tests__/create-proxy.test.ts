import { expect } from 'chai'
import sinon from 'sinon'
import set from 'lodash/set'
import m from 'noodl-test-utils'
import y from 'yaml'
import { normalizeProps } from 'noodl-ui'
import { fp } from 'noodl-core'
import { resolve as _resolve } from './resolve'
import { createNode } from '../utils/createNode'
import { createProxy } from '../create-proxy'
import { normalizeDeep } from '../utils/normalize-deep'
import * as c from '../constants'

let viewport = { width: 1024, height: 768 }

describe(`createProxy`, () => {
  describe(`when using ordinary javascript get/set/delete on objects`, () => {
    it(`should return primitive values as scalars`, () => {
      const component = { type: 'view' }
      const proxy = createProxy(component)
      expect(proxy.get('type', true)).to.be.instanceOf(y.Scalar)
    })

    it(`should set primitives as Scalar values`, () => {
      const component = {}
      const proxy = createProxy(component)
      proxy.type = 'view'
      set(proxy, 'style', { top: '0.2' })
      expect(proxy.get('type', true)).to.be.instanceOf(y.Scalar)
      expect(proxy.get('style', true)).to.be.instanceOf(y.YAMLMap)
      expect(proxy.getIn(['style', 'top'])).to.eq('0.2')
      set(proxy.style, 'border', '2')
      expect(proxy.getIn(['style', 'border'], true)).to.be.instanceOf(y.Scalar)
      expect(proxy.getIn(['style', 'border'], true)).to.have.property(
        'value',
        '2',
      )
    })

    it(`should normalize the props onto the node`, () => {
      const component = m.image({
        path: 'abc.png',
        viewTag: 'abcTag',
        style: {
          top: '0.1',
          textAlign: { x: 'centerX', y: 'center' },
          border: { style: '3' },
          isHidden: 'false',
          shadow: 'true',
        },
      })
      const result = normalizeProps(createProxy({}), component, {
        viewport,
      })
      expect(result.has('data-viewtag')).to.be.true
      expect(result.get('data-viewtag')).to.eq('abcTag')
    })

    it(`should merge spreaded objects`, () => {
      const proxy = createProxy({ style: {} })
      proxy.style = {
        ...proxy.style,
        isHidden: true,
        shadow: 'true',
        border: { style: '2' },
      }
      expect(proxy.getIn(['style', 'isHidden'])).to.be.true
      expect(proxy.getIn(['style', 'shadow'])).to.eq('true')
      expect(proxy.getIn(['style', 'border', 'style'])).to.eq('2')
    })

    it(`should be able to deeply access children`, () => {
      const component = m.view({
        children: [
          m.scrollView({
            children: [
              m.list({
                iteratorVar: 'itemObject',
                listObject: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
                children: [
                  m.listItem({
                    itemObject: '',
                    children: [m.image('abc.png')],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      const proxy = createProxy(component)
      const list = proxy.children[0].children[0]
      expect(list.type).to.eq('list')
      expect(list.children[0].children[0]).to.have.property('type', 'image')
    })

    it.skip(`should remove reserved noodl style keys`, () => {
      const component = m.view({
        style: c.reservedStyleKeys.reduce(
          (acc, key) => fp.assign(acc, { [key]: 'abc' }),
          {},
        ),
      })
      const node = normalizeProps(createProxy({}), component, {
        viewport,
      })
      expect(node.get('style').toJSON()).to.be.an('object')
      const style = node.get('style')
      c.reservedStyleKeys.forEach((key) => {
        expect(
          style.has(key),
          `expected node to remove reserved noodl style key "${key}"`,
        ).to.be.false
      })
    })
  })
})
