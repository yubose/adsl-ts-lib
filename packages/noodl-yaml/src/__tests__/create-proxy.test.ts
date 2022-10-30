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
import { ui } from './test-utils'
import * as c from '../constants'

let viewport = { width: 1024, height: 768 }

describe.only(`createProxy`, () => {
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
      const component = ui.image({
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

  it(`should be able to manipulate/normalize the node as if it was a plain object`, () => {
    const listObject = [{ color: 'red' }, { color: 'green' }, { color: 'blue' }]
    const component = m.view({
      style: { top: '0.1', left: '0.1', width: '1', height: '1' },
      children: [
        m.ecosDocComponent({
          children: [
            // @ts-expect-error
            m.textField({
              contentType: 'email',
              dataKey: 'formData.password',
              global: true,
              placeholder: 'Enter your password',
              onChange: [
                m.evalObject({
                  object: [
                    { [`.Global.initialPassword@`]: '..formData.password' },
                  ],
                }),
                m.builtIn({ funcName: 'redraw', viewTag: 'helloTag' }),
              ],
              onInput: m.emitObject({
                actions: [
                  m.ifObject([
                    true,
                    { [`.Global.timestamp`]: Date.now() },
                    'continue',
                  ]),
                ],
              }),
              required: true,
              style: {
                border: '2',
                shadow: 'true',
              },
              textAlign: {
                x: 'centerX',
                y: 'centerY',
              },
              viewTag: 'inputTag',
            }),
            m.view({
              children: [
                m.scrollView({
                  children: [
                    m.list({
                      iteratorVar: 'itemObject',
                      listObject,
                      children: [
                        m.listItem({
                          itemObject: '',
                          style: { shadow: 'true' },
                          children: [
                            m.view({ children: [m.image('hello.gif')] }),
                            m.video('sun.mkv'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      viewTag: 'helloTag',
    })

    const node: any = normalizeDeep(component, {
      rootKey: 'SignIn',
      root: { SignIn: { formData: { password: '123' } } },
      viewport,
    })

    expect(node.get('data-viewtag')).to.eq('helloTag')

    {
      const style = (node.get('style') as y.YAMLMap)?.toJSON()
      expect(style).to.have.property('top', '76.80px')
      expect(style).to.have.property('left', '102.40px')
      expect(style).to.have.property('width', '1024px')
      expect(style).to.have.property('height', '768px')
    }

    {
      const children = node.get('children').get(0).get('children')
      const textFieldNode = children.get(0)
      const viewNode = children.get(1)
      expect(textFieldNode.get('data-key')).to.eq('formData.password')
      expect(textFieldNode.get('data-value')).to.eq('123')
      expect(textFieldNode.get('data-viewtag')).to.eq('inputTag')
      expect(textFieldNode.get('placeholder')).to.eq('Enter your password')
      expect(textFieldNode.get('required')).to.eq(true)
      expect(textFieldNode.get('type')).to.eq('textField')
      const style = textFieldNode.get('style') as y.YAMLMap
      expect(style).not.to.have.property('shadow')
      expect(style).not.to.have.property('textAlign')
      expect(style).to.have.property('boxShadow')
      const image = viewNode.children[0].children[0].children[0].children[0]
        .children[0] as y.YAMLMap
      expect(image).to.have.property('path', 'hello.gif')
      const video = viewNode.children[0].children[0].children[0]
        .children[1] as y.YAMLMap
      expect(video).to.have.property('type', 'video')
      expect(video).to.have.property('path', 'sun.mkv')
    }

    {
      const list = node
        .get('children')
        .get(0)
        .get('children')
        .get(1)
        .get('children')
        .get(0)
        .get('children')
        .get(0) as y.YAMLMap

      listObject.forEach((_, index) => {
        // @ts-expect-error
        const listItem = list.get('children')?.get?.(index)
        expect(listItem.get('type')).to.eq('listItem')
        expect(listItem.get('style').get('boxShadow')).to.eq(
          '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
        )
        expect(listItem.get('children').items).to.have.lengthOf(2)
      })
    }
  })

  xit(`should be able to visit nodes like normal`, () => {
    const listObject = [{ color: 'red' }, { color: 'green' }, { color: 'blue' }]
    const component = m.view({
      style: { top: '0.1', left: '0.1', width: '1', height: '1' },
      children: [
        m.ecosDocComponent({
          children: [
            // @ts-expect-error
            m.textField({
              contentType: 'email',
              dataKey: 'formData.password',
              global: true,
              placeholder: 'Enter your password',
              onChange: [
                m.evalObject({
                  object: [
                    { [`.Global.initialPassword@`]: '..formData.password' },
                  ],
                }),
                m.builtIn({ funcName: 'redraw', viewTag: 'helloTag' }),
              ],
              onInput: m.emitObject({
                actions: [
                  m.ifObject([
                    true,
                    { [`.Global.timestamp`]: Date.now() },
                    'continue',
                  ]),
                ],
              }),
              required: true,
              style: {
                border: '2',
                shadow: 'true',
              },
              textAlign: {
                x: 'centerX',
                y: 'centerY',
              },
              viewTag: 'inputTag',
            }),
            m.view({
              children: [
                m.scrollView({
                  children: [
                    m.list({
                      iteratorVar: 'itemObject',
                      listObject,
                      children: [
                        m.listItem({
                          itemObject: '',
                          style: { shadow: 'true' },
                          children: [
                            m.view({ children: [m.image('hello.gif')] }),
                            m.video('sun.mkv'),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      viewTag: 'helloTag',
    })

    const node = createNode(component)

    const spy = sinon.spy()
    y.visit(node, {
      Map: console.log,
    })

    console.log(spy.callCount)
  })
})
