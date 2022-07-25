import { expect } from 'chai'
import * as nc from 'noodl-common'
import * as util from '../utils'
import { createRender, ui } from '../test-utils'

describe(nc.coolGold(`createRender`), () => {
  it(`should be able to render to the DOM with just 1 or more components`, async () => {
    const node = util.findByElementId(await createRender(ui.button()).render())
    expect(node).to.exist
    expect(node).to.have.property('tagName').to.eq('BUTTON')
  })

  it(`assetsUrl should not be empty`, () => {
    const { assetsUrl } = createRender(ui.button())
    expect(assetsUrl).not.to.be.empty
  })

  it(`baseUrl should not be empty`, () => {
    const { baseUrl } = createRender(ui.button())
    expect(baseUrl).not.to.be.empty
  })

  it(`nui should not be empty`, () => {
    const { nui } = createRender(ui.button())
    expect(nui).not.to.be.empty
  })

  it(`page should be an NDOM page`, () => {
    const { page } = createRender(ui.button())
    expect(page).not.to.be.empty
  })

  it(`pageObject should not be empty`, () => {
    const { pageObject } = createRender(ui.button())
    expect(pageObject).not.to.be.empty
  })

  it(`should render the DOM node by only providing a component`, async () => {
    expect(
      util.findByElementId(await createRender(ui.button()).render()),
    ).to.have.property('tagName', 'BUTTON')
  })

  it(`should default the current page to Hello when calling request`, async () => {
    const { page, request } = createRender(ui.button())
    expect(page).to.have.property('page').not.eq('Hello')
    await request()
    expect(page).to.have.property('page', 'Hello')
  })

  it(`should default the current page to Hello when calling render`, async () => {
    const { page, render } = createRender(ui.button())
    expect(page).to.have.property('page').not.eq('Hello')
    await render()
    expect(page).to.have.property('page', 'Hello')
  })

  it(`should reset requestingPage after calling request`, async () => {
    const { page, request } = createRender(ui.button())
    await request()
    expect(page).to.have.property('requesting', '')
    expect(page).to.have.property('page', 'Hello')
  })

  it(`should auto sync the pageName and pageObject together with the root  if pageName not provided`, async () => {
    const expected = { components: [ui.ecosDocComponent()] }
    let { pageObject, getRoot } = createRender({
      pageObject: expected,
    })
    expect(getRoot()['Hello']).to.deep.eq(pageObject)
    expect(getRoot().Hello).to.deep.eq(pageObject)
  })

  it(`should auto sync the pageName and pageObject together with the root if pageName is provided`, async () => {
    const expected = { components: [ui.ecosDocComponent()] }
    let { pageObject, getRoot } = createRender({
      pageName: 'SignIn',
      pageObject: expected,
    })
    expect(pageObject).to.deep.eq(expected)
    expect(getRoot().SignIn).to.deep.eq(expected)
    expect(getRoot().Hello).not.to.deep.eq(expected)
  })

  it(`should return the equivalent value of providing a component when providing an array of 1 component, a single component, and vice versa for the page object as well as the root object`, async () => {
    const getResult1 = () => createRender(ui.button()).pageObject

    const getResult2 = () =>
      createRender({ components: ui.button() }).pageObject

    const getResult3 = () =>
      createRender({
        root: { Hello: { components: ui.button() } },
      } as any).pageObject

    const getResult4 = () =>
      createRender({
        root: { Hello: { components: [ui.button()] } },
      }).pageObject

    const getResult5 = () => createRender([ui.button()]).pageObject

    expect(getResult1()).to.deep.eq(getResult2())
    expect(getResult1()).to.deep.eq(getResult3())
    expect(getResult1()).to.deep.eq(getResult4())
    expect(getResult1()).to.deep.eq(getResult5())
  })

  it(`should merge the partial pageObject and root pageObject together if both are colliding`, async () => {
    const { getRoot, pageObject } = createRender({
      components: ui.button(),
      pageObject: { formData: { gender: 'Female' }, components: [] },
      root: { Hello: { patientInfoPage: 'PatientInfo', components: [] } },
    })
    expect(pageObject).to.deep.eq(getRoot().Hello)
    expect(pageObject).to.have.property('patientInfoPage', 'PatientInfo')
  })
})
