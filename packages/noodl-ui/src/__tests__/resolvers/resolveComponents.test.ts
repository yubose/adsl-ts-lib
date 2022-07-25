import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { waitFor } from '@testing-library/dom'
import { ComponentObject } from 'noodl-types'
import { ui } from '../../utils/test-utils'
import nui from '../../noodl-ui'
import NuiPage from '../../Page'
import Viewport from '../../Viewport'
import * as c from '../../constants'

const getRoot = (args?: Record<string, any>) => ({
  Hello: { components: [mock.getButtonComponent()] },
  ...args,
})

const getPages = () => ['Hello', 'Cereal', 'SignIn']

async function resolveComponent(component: ComponentObject) {
  const pageName = 'Hello'
  const pageObject = { components: u.array(component) }
  nui.use({
    getPages,
    getRoot: () => getRoot({ [pageName]: pageObject }),
    transaction: {
      [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () => pageObject,
    },
  })
  const page = nui.createPage({
    name: pageName,
    viewport: { width: 375, height: 667 },
  })
  return nui.resolveComponents({ components: component, page })
}

describe(coolGold(`resolveComponents (ComponentResolver)`), () => {
  it(`should call the callback on every resolved child in order of creation time`, async () => {
    const spy = sinon.spy((f) => undefined)
    const listObject = [{ fruit: 'apple' }, { fruit: 'berry' }]
    const iteratorVar = 'itemObject'
    const pageObject = {
      components: [
        ui.view({
          children: [
            ui.label({ viewTag: 'labelTagAboveList' }),
            ui.list({
              iteratorVar,
              listObject,
              contentType: 'listObject',
              children: [
                ui.listItem({
                  viewTag: `listItemTag`,
                  [iteratorVar]: '',
                  children: [
                    ui.label({ dataKey: `${iteratorVar}.fruit` }),
                    ui.textField({
                      dataKey: `${iteratorVar}.fruit`,
                      placeholder: 'Edit fruit',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ui.button({ viewTag: 'submitTag', text: 'Submit' }),
        ui.button({ viewTag: 'closeTag', text: 'Close' }),
      ],
    }
    const HelloPg = nui.getRoot().Hello
    nui.use({ getRoot: () => ({ Hello: HelloPg, Sam: pageObject }) })
    const page = nui.getRootPage()
    page.page = 'Sam'
    const components = await nui.resolveComponents({
      components: pageObject.components,
      page,
      callback: spy,
    })
    const expectedCallsInOrder = [
      { type: 'view' },
      { type: 'label' },
      { type: 'list' },
      { type: 'listItem' },
      { type: 'label' },
      { type: 'textField' },
      { type: 'listItem' },
      { type: 'label' },
      { type: 'textField' },
      { type: 'button' },
      { type: 'button' },
    ]
    expect(spy).to.have.property('callCount').to.eq(expectedCallsInOrder.length)
    const calls = spy.getCalls()
    expectedCallsInOrder.forEach((res, index) => {
      expect(res.type).to.eq(calls[index]?.args?.[0]?.type)
    })
  })

  describe('hooks', () => {
    describe(`if`, () => {
      it.skip(`should pass in the key and value`, async () => {
        const spy = sinon.spy(() => true)
        const ifObj = { if: [{}, 'hello', 'bye'] }
        ;(
          await nui.resolveComponents({
            components: ui.button({
              text: ifObj,
              onClick: [ui.emit()],
              style: { border: { style: '2' }, shadow: 'true' },
            }),
            on: { if: spy },
          })
        ).get('text')
        const args = spy.args[0][0]
        expect(spy).to.be.calledOnce
        expect(args).to.have.property('key', 'text')
        expect(args).to.have.property('value', ifObj)
      })

      it(`should resolve using the if in hooks when provided`, async () => {
        expect(
          (
            await nui.resolveComponents({
              components: ui.button({
                text: { if: [{}, 'hello', 'bye'] },
                onClick: [ui.emit()],
                style: { border: { style: '2' }, shadow: 'true' },
              }),
              on: { if: () => true },
            })
          ).get('text'),
        ).to.eq('hello')
        expect(
          (
            await nui.resolveComponents({
              components: ui.button({
                text: { if: [{}, 'hello', 'bye'] },
                onClick: [ui.emit()],
                style: { border: { style: '2' }, shadow: 'true' },
              }),
              on: { if: () => false },
            })
          ).get('text'),
        ).to.eq('bye')
      })
    })
  })

  describe(italic(`list`), () => {
    let listObject: ReturnType<typeof mock.getGenderListObject>
    let componentObject: ReturnType<typeof mock.getListComponent>

    beforeEach(() => {
      listObject = mock.getGenderListObject()
      componentObject = mock.getListComponent({
        contentType: 'listObject',
        iteratorVar: 'cereal',
        listObject,
      })
    })

    it(
      `should generate the same amount of children as the length of ` +
        `its listObject`,
      async () => {
        const component = await resolveComponent(componentObject)
        expect(component)
          .to.have.property('children')
          .lengthOf(listObject.length)
      },
    )

    it(
      `should provide the dataObject to each listItem children by setting ` +
        `it as the value to a property that is taken from value of ${magenta(
          'iteratorVar',
        )}`,
      async () => {
        const component = await resolveComponent(componentObject)
        const iteratorVar = component.get('iteratorVar') || ''
        component
          .get('listObject')
          .forEach((dataObject: any, index: number) => {
            expect(component.child(index).props).to.have.property(
              iteratorVar,
              dataObject,
            )
          })
      },
    )
  })

  describe(italic(`Page`), () => {
    let componentObject: ReturnType<typeof ui.page>

    beforeEach(() => {
      componentObject = ui.page('Cereal')
    })

    async function resolveComponent(component: ComponentObject) {
      const pageObject = { components: u.array(component) }
      nui.use({
        getPages,
        getRoot: () => getRoot({ Cereal: pageObject }),
        transaction: {
          [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () => pageObject,
        },
      })
      const page = nui.createPage({
        name: 'Hello',
        viewport: { width: 375, height: 667 },
      })
      return nui.resolveComponents({ components: component, page })
    }

    it(`should set "page" on the component that is an instance of NuiPage`, async () => {
      expect(
        (await resolveComponent(componentObject)).get('page'),
      ).to.be.instanceOf(NuiPage)
    })

    it(`should set its current page name to its "path" value`, async () => {
      expect((await resolveComponent(componentObject)).get('page').page).to.eq(
        'Cereal',
      )
    })

    it(`should have created its own Viewport inside the Page`, async () => {
      expect((await resolveComponent(componentObject)).get('page'))
        .to.have.property('viewport')
        .to.be.instanceOf(Viewport)
    })

    it(
      `should have set the Viewport's width/height as the same as the ` +
        `component if it was provided`,
      async () => {
        const component = await resolveComponent({
          ...componentObject,
          style: { width: '0.2', height: '0.5', top: '0' },
        })
        const page = component.get('page') as NuiPage
        expect(page.viewport.width + 'px').to.eq(
          Number(
            Viewport.getSize(
              component.blueprint.style.width,
              nui.getRootPage().viewport.width,
            ),
          ).toPrecision() + 'px',
        )
        expect(page.viewport.height + 'px').to.eq(
          Number(
            Viewport.getSize(
              component.blueprint.style.height,
              nui.getRootPage().viewport.height,
            ),
          ).toPrecision() + 'px',
        )
      },
    )

    it(
      `should have set the Viewport's width/height to the root page's viewport's ` +
        `width/height if it was not provided`,
      async () => {
        const component = await resolveComponent({
          ...componentObject,
          style: {},
        })
        const page = component.get('page') as NuiPage
        const rootPage = nui.getRootPage()
        expect(page.viewport.width).to.eq(rootPage.viewport.width)
        expect(page.viewport.height).to.eq(rootPage.viewport.height)
      },
    )

    it(
      `should rerun the fetch components function and emit PAGE_COMPONENTS ` +
        `with the new components when PAGE_CHANGED is emitted`,
      async () => {
        const dividerComponent = ui.divider({ id: 'divider' })
        const Cereal = {
          components: ui.page({
            path: 'Hello',
            children: [ui.label('Hi all')],
          }),
        }
        const spy = sinon.spy()
        nui.use({
          getRoot: () =>
            getRoot({ Cereal, Tiger: { components: [dividerComponent] } }),
          getPages: () => ['Cereal', 'Hello', 'Tiger'],
          transaction: {
            [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (p) =>
              p.page === 'Tiger' ? nui.getRoot().Tiger : Cereal,
          },
        })
        const component = await nui.resolveComponents(Cereal.components)
        expect(component.get('page')).to.be.instanceOf(NuiPage)
        const page = component.get('page') as NuiPage
        page?.on(c.nuiEvent.component.page.PAGE_CHANGED, spy)
        page.page = 'Tiger'
        page.emit(c.nuiEvent.component.page.PAGE_CHANGED)
        await waitFor(() => expect(spy).to.be.calledOnce)
        expect(component.get('page')).to.have.property('page', 'Tiger')
        expect(component.get('page'))
          .to.have.property('components')
          .to.deep.eq([dividerComponent])
      },
    )

    describe(`when passing in remote urls (http**/*)`, () => {
      xit(``, () => {
        //
      })
    })
  })

  describe(italic(`plugin`), () => {
    it(
      `should emit the ${magenta(`content`)} event with the content when ` +
        `contents are fetched`,
      async () => {
        const component = await nui.resolveComponents({
          components: ui.pluginBodyTail({ path: 'abc.html' }),
        })
        const spy = sinon.spy(async () => 'hello123')
        component.on('content', spy)
        await waitFor(() => {
          expect(spy).to.be.calledOnce
        })
      },
    )

    xit(`should set this "content" property with the data received as its value`, async () => {
      const component = await nui.resolveComponents({
        components: ui.pluginHead({ path: 'abc.html' }),
      })
      const contents = 'hello123'
      global.fetch = (f) => f
      const spy = sinon.stub(global, 'fetch').returns(async () => contents)
      global.fetch = spy
      component.on('content', spy)
      await waitFor(() => {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledWith(contents)
        // expect(spy
      })
    })
  })

  describe(italic(`register`), () => {
    //
  })

  describe(italic(`scrollView`), () => {
    //
  })

  describe(italic(`textField`), () => {
    it(`should set the data-value from local root`, async () => {
      const pageObject = {
        formData: { password: 'mypassword' },
        components: [ui.textField('formData.password')],
      }
      nui.use({ getRoot: () => ({ Hello: pageObject }) })
      const component = (await nui.resolveComponents(pageObject.components))[0]
      const value = component.get('data-value')
      expect(value).to.eq(pageObject.formData.password)
    })
  })

  describe(italic(`textBoard`), () => {
    //
  })

  describe(italic(`contentType: timer`), () => {
    //
  })
})
