import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { ui } from '../../utils/test-utils'
import nui from '../../noodl-ui'

describe(coolGold(`resolveStyles (ComponentResolver)`), () => {
  describe(italic(`Components`), () => {
    describe(magenta('page'), () => {
      it(`should have its styles parsed like others`, async () => {
        const components = await nui.resolveComponents([
          ui.view({
            style: { shadow: 'true' },
            children: [
              ui.page({
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

  describe(magenta(`listObject references`), () => {
    it(`should resolve references coming from listItem data objects`, async () => {
      const listObject = [
        {
          key: 'this is test2',
          height: '0.1',
          bgColor: '0xFFCCCC',
          fontColor: '0xFF0033',
        },
      ]
      const listComponentObject = ui.list({
        listObject,
        iteratorVar: 'itemObject',
        children: [
          ui.listItem({
            iteratorVar: 'itemObject',
            itemObject: '',
            style: {
              width: '1',
              height: 'itemObject.height',
              backgroundColor: 'itemObject.bgColor',
            },
            children: [
              ui.label({
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
