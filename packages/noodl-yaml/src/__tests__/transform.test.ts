import { expect } from 'chai'
import sinon from 'sinon'
import set from 'lodash/set'
import m from 'noodl-test-utils'
import y from 'yaml'
import { presets, normalizeProps } from 'noodl-ui'
import { fp } from 'noodl-core'
import { createNode } from '../utils/createNode'
import { createProxy } from '../create-proxy'
import { transform } from '../transform'
import * as c from '../constants'

let viewport = { width: 1024, height: 768 }

describe(`transform`, () => {
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

    const node: any = transform(component, {
      deep: true,
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
        const listItem = list.get('children')?.['get']?.(index)
        expect(listItem.get('type')).to.eq('listItem')
        expect(listItem.get('style').get('boxShadow')).to.eq(
          '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
        )
        expect(listItem.get('children').items).to.have.lengthOf(2)
      })
    }
  })

  describe(`styles`, () => {
    Object.entries(presets.border).forEach(([preset, styles]) => {
      it(`should apply the border preset "${preset}"`, () => {
        const component = m.image({ style: { border: { style: preset } } })
        const result = transform(component)
        Object.entries(styles).forEach(([k, v]) => {
          expect(result.style).to.have.property(k, v)
        })
      })
    })

    it(`should transform textAlign expectedly`, () => {
      const component = m.view({
        style: { textAlign: { x: 'centerX', y: 'centerY' } },
      })
      const result = transform(component)
      expect(result.style).to.have.property('alignItems', 'center')
      expect(result.style).to.have.property('display', 'flex')
      expect(result.style).to.have.property('justifyContent', 'center')
      expect(result.style).to.have.property('textAlign', 'center')
    })
  })
})
