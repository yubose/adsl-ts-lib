import * as u from '@jsmanifest/utils'
import { OrArray } from '@jsmanifest/typefest'
import { NUI, Page as NUIPage } from 'noodl-ui'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { _defaults, createRender, ndom } from '../test-utils'
import { BASE_PAGE_URL } from '../constants'
import Page from '../Page'

const createPage = ({ pageUrl }: { pageUrl?: OrArray<string> } = {}) => {
  const page = new Page(NUI.createPage() as NUIPage)
  if (pageUrl) {
    u.array(pageUrl).forEach((part) => {
      if (page.pageUrl === BASE_PAGE_URL) page.pageUrl += part
      else page.pageUrl += `-${part}`
    })
  }
  return page
}

afterEach(() => {
  ndom.page?.remove()
})

describe(coolGold(`Page`), () => {
  it(`should initiate the pageUrl with "${BASE_PAGE_URL}"`, () => {
    const page = createPage()
    expect(page.pageUrl).to.eq(BASE_PAGE_URL)
  })

  xit(`should change the pageUrl expectedly when navigating`, async () => {
    const { page } = createRender({ components: [] })
    expect(page.pageUrl).to.eq(BASE_PAGE_URL)
    page.requesting = 'Abc'
    expect(page.pageUrl).to.eq(`${BASE_PAGE_URL}Abc`)
    expect(page.getPreviousPage('SignIn')).to.eq('Abc')
  })

  xit(`should return the same id as its nuiPage id`, () => {
    //
  })
})
