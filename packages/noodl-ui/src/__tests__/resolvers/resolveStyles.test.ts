// @ts-nocheck
import m from 'noodl-test-utils'
import { expect } from 'chai'
import nui from '../../noodl-ui'

describe(`resolveStyles (ComponentResolver)`, () => {
  describe(`Components`, () => {
    describe('page', () => {
      it(`should have its styles parsed like others`, async () => {
        const components = await nui.resolveComponents([
          m.view({
            style: { shadow: 'true' },
            children: [
              m.page({
                path: 'Abc',
                style: {
                  shadow: 'true',
                  width: '0.2',
                  top: '0.1',
                },
              }),
            ],
          }),
        ])
        const [viewComponent] = components
        const pageComponent = (viewComponent as any).child()
        expect(pageComponent.style).to.have.property(
          'boxShadow',
          '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
        )
        expect(pageComponent.style).to.have.property('width')
        expect(pageComponent.style).to.have.property('top')
      })
    })
  })

  describe(`listObject references`, () => {
    it(`should resolve references coming from listItem data objects`, async () => {
      const listObject = [
        {
          key: 'this is test2',
          height: '0.1',
          bgColor: '0xFFCCCC',
          fontColor: '0xFF0033',
        },
      ]
      const listComponentObject = m.list({
        listObject,
        iteratorVar: 'itemObject',
        children: [
          m.listItem({
            iteratorVar: 'itemObject',
            itemObject: '',
            style: {
              width: '1',
              height: 'itemObject.height',
              backgroundColor: 'itemObject.bgColor',
            },
            children: [
              m.label({
                dataKey: 'itemObject.key',
                style: { width: '1', color: 'itemObject.fontColor' },
              }),
            ],
          }),
        ],
      })
      let list = (
        await nui.resolveComponents({ components: [listComponentObject] })
      )[0]
      let listItem = list.child()
      let label = listItem.child()
      expect(listItem.style).to.have.property('height', '66.70px')
      expect(listItem.style).to.have.property('backgroundColor', '#FFCCCC')
      expect(label.style).to.have.property('color', '#FF0033')
      listObject[0].height = '0.9'
      listObject[0].bgColor = '0x00000'
      listObject[0].fontColor = '0x334455'
      list = (
        await nui.resolveComponents({ components: [listComponentObject] })
      )[0]
      listItem = list.child()
      label = listItem.child()
      expect(listItem.style).to.have.property('height', '600.30px')
      expect(listItem.style).to.have.property('backgroundColor', '#00000')
      expect(label.style).to.have.property('color', '#334455')
    })
  })
})
