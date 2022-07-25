import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import * as n from '../utils/noodl'
import { createDataKeyReference, ui } from '../utils/test-utils'
import NUI from '../noodl-ui'
import NUIPage from '../Page'
import Viewport from '../Viewport'
import isPage from '../utils/isPage'
import isViewport from '../utils/isViewport'
import log from '../utils/log'
import * as c from '../constants'
import * as s from '../utils/style'
import * as t from '../types'

/** REMINDER: Total components created should be 9 for this func */
const getResolvedListComponentPreset = async () =>
  NUI.resolveComponents(
    ui.list({
      contentType: 'listObject',
      iteratorVar: 'iceCream',
      listObject: [{ key: 'Gender', value: 'Male' }],
      children: [
        ui.listItem({
          iceCream: '',
          children: [
            ui.view({
              children: [
                ui.select([]),
                ui.button(),
                ui.textField(),
                ui.view({ children: [] }),
                ui.view({ children: [ui.label()] }),
              ],
            }),
          ],
        }),
      ],
    }),
  )

describe(`utils`, () => {
  describe(`test-utils`, () => {
    xit(``, () => {
      //
    })
  })

  beforeEach(() => {
    createDataKeyReference({
      pageName: 'Cat',
    })
  })

  describe(`findIteratorVar`, () => {
    it(`should get the iteratorVar if its a list`, async () => {
      expect(
        n.findIteratorVar(
          await NUI.resolveComponents(ui.list({ iteratorVar: 'hello' })),
        ),
      ).to.eq('hello')
    })

    it(`should get the iteratorVar if its a listItem`, async () => {
      const list = await NUI.resolveComponents(ui.list({ iteratorVar: 'trap' }))
      const listItem = list.child()
      expect(n.findIteratorVar(listItem)).to.eq('trap')
    })

    it(`should get the iteratorVar if its a deeply nested descendant`, async () => {
      const list = await NUI.resolveComponents(
        ui.list({
          iteratorVar: 'iceCream',
          children: [
            ui.listItem({
              children: [
                ui.view({
                  children: [ui.button],
                }),
              ],
            }),
          ],
        }),
      )
      const button = list.child().child().child()
      expect(n.findIteratorVar(button)).to.eq('iceCream')
    })
  })

  describe(`flatten`, () => {
    it(`should flatten into an array of all the components`, async () => {
      const resolved = await getResolvedListComponentPreset()
      await waitFor(async () => {
        expect(n.flatten(resolved)).to.have.lengthOf(9)
      })
    })
  })

  xdescribe(`findParent`, async () => {
    it(
      `should call the callback on all parents including the last one ` +
        `if none of the conditions are passing`,
      async () => {
        const spy = sinon.spy()
        n.findParent(await getResolvedListComponentPreset(), spy)
        expect(spy).to.have.callCount(8)
      },
    )
  })

  describe(`isListConsumer`, () => {
    it(`should return true for list components`, async () => {
      expect(n.isListConsumer(await NUI.resolveComponents(ui.list()))).to.be
        .true
    })

    it(`should return true for listItem components`, async () => {
      expect(n.isListConsumer((await NUI.resolveComponents(ui.list())).child()))
        .to.be.true
    })

    it(`should return true for deeply nested descendants of a list`, async () => {
      log.disableAll()
      const preset = await getResolvedListComponentPreset()
      expect(
        n.isListConsumer(
          (await NUI.resolveComponents(preset))
            .child()
            .child()
            .child(4)
            .child(),
        ),
      ).to.be.true
      log.setLevel('ERROR')
    })
  })

  describe(`isListLike`, () => {
    it(`should return true for list components`, async () => {
      expect(
        n.isListLike(
          await NUI.resolveComponents(
            ui.list({
              contentType: 'listObject',
              iteratorVar: 'itemObject',
              children: [ui.listItem({ itemObject: '' })],
            }),
          ),
        ),
      ).to.be.true
    })

    it(`should return true for chatList components`, async () => {
      expect(n.isListLike(await NUI.resolveComponents({ type: 'chatList' }))).to
        .be.true
    })
  })

  describe(`publish`, () => {
    it(`should call the callback on every child including the last one`, async () => {
      const spy = sinon.spy()
      const components = await getResolvedListComponentPreset()
      n.publish(components, spy)
      await waitFor(() => expect(spy).to.have.callCount(8))
    })
  })
})

describe(`resolveAssetUrl`, () => {
  describe(`when resolving through list item data objects`, () => {
    const assetsUrl = 'https://aitmed.com/abc/assets/'
    const iteratorVar = 'imagePath'
    const imagePath = 'pigBlack.png'
    const src = `${assetsUrl}${imagePath}`
    const dataObject = {
      imagePath,
      imgName: 'Free',
      number: 1,
    }

    it(
      `should return the correct url using the list item ` + `iteratorVar`,
      () => {
        expect(
          n.resolveAssetUrl(src, { assetsUrl, dataObject, iteratorVar }),
        ).to.eq(`${assetsUrl}${imagePath}`)
      },
    )
  })

  it(`should return true`, () => {
    expect(n.resolveAssetUrl('abc.png', NUI.getAssetsUrl())).to.eq(
      `${NUI.getAssetsUrl()}abc.png`,
    )
  })
})

describe(`styles`, () => {
  const tests = {
    vw: {
      vpSize: 1024,
      values: [],
    },
    vh: {
      vpSize: 768,
      get values() {
        return [
          ['0vh', 0],
          ['1vh', 7.68],
          ['0.3vh', 2.3],
          ['1.15vh', 8.83],
          ['3.4vh', 26.11],
          ['4vh', 30.72],
        ]
      },
    },
  }
})

for (const [name, fn, Construct] of [
  ['isPage', isPage, NUIPage],
  ['isViewport', isViewport, Viewport],
] as const) {
  it(`[${name}] should return true`, () => {
    expect(fn(new Construct())).to.be.true
  })

  it(`[${name}] should return false`, () => {
    expect(fn({})).to.be.false
  })
}
