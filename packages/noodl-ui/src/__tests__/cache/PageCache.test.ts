import { expect } from 'chai'
import m from 'noodl-test-utils'
import NUIPage from '../../Page'
import { nui } from '../../utils/test-utils'

let page: NUIPage

beforeEach(() => {
  page = nui.createPage({ viewport: { width: 375, height: 667 } })
  page.page = 'CreateNewAccount'
})

describe(`PageCache`, () => {
  it(`should clear internal state`, async () => {
    const page = nui.createPage('SignIn')
    const root = {
      Dashboard: {
        components: [
          m.scrollView({
            children: [m.select({ options: '.SignIn.listData' })],
          }),
        ],
      },
      SignIn: {
        listData: [{ color: 'red' }, { color: 'green' }],
        components: [
          m.view({
            children: [
              m.list({
                iteratorVar: 'itemObject',
                listObject: '.SignIn.listData',
                children: [
                  m.listItem({
                    itemObject: '',
                    children: [
                      m.label({ dataKey: 'itemObject.color' }),
                      m.textField({
                        dataKey: 'itemObject.color',
                        placeholder: 'Edit color',
                        style: { shadow: 'true' },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    }
    nui.use({ getRoot: () => root, getPages: () => ['SignIn'] })
    page.page = 'SignIn'
    await nui.resolveComponents(page.components, page)
    console.log(nui.cache.page)
    let state = nui.cache.page.toJSON()
    expect(state).to.have.property('ids').to.have.lengthOf(4)
    expect(state).to.have.lengthOf(4)
    expect(state)
      .to.have.property('pageNames')
      .to.deep.eq(['Hello', 'CreateNewAccount', 'SignIn'])
    nui.cache.page.clear()
    state = nui.cache.page.toJSON()
    expect(state).to.have.property('ids').to.have.lengthOf(0)
    expect(state).to.have.lengthOf(0)
    expect(state).to.have.property('pageNames').to.deep.eq([])
  })
})
