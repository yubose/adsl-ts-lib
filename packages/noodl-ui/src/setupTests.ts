import sinonChai from 'sinon-chai'
import chai from 'chai'
import JSDOM from 'jsdom-global'
import { assetsUrl, baseUrl, getPresetPageObjects } from './utils/test-utils'
import nui from './noodl-ui'
import log from './utils/log'
import type NuiPage from './Page'
import * as c from './constants'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: baseUrl,
  pretendToBeVisual: true,
})

chai.use(sinonChai)

before(() => {
  log.setLevel('debug')
})

beforeEach(() => {
  const root = getPresetPageObjects()
  nui.createPage({ name: 'Hello', viewport: { width: 375, height: 667 } })
  nui.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPages: () => Object.keys(root),
    getRoot: () => root,
    transaction: {
      [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (page: NuiPage) =>
        nui.getRoot()[page.page],
    },
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  nui.reset()
})
