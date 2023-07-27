import chai from 'chai'
import sinonChai from 'sinon-chai'
import JSDOM from 'jsdom-global'
import pb from 'pretty-bytes'
import log from '../utils/log'
import nui from '../noodl-ui'
import NuiPage from '../Page'
import * as c from '../constants'

chai.use(sinonChai)

const baseUrl = 'http://127.0.0.1:3000/'
const assetsUrl = `${baseUrl}assets/`
// const viewport = { width: 375, height: 667 }

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: baseUrl,
  pretendToBeVisual: true,
})

xdescribe(`attributes`, () => {
  before(() => {
    process.stdout.write('\x1Bc')
    log.setLevel('debug')
  })

  beforeEach(() => {
    const root = {}
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
    Object.defineProperties(nui, {
      getAssetsUrl: { value: null },
      getBaseUrl: { value: null },
      getPreloadPages: { value: null },
      getPages: { value: null },
      getRoot: { value: null },
    })
  })

  after(() => {
    const { rss, heapTotal, heapUsed, external } = process.memoryUsage()
    console.log(`Memory usage: `, {
      rss: pb(rss),
      heapTotal: pb(heapTotal),
      heapUsed: pb(heapUsed),
      external: pb(external),
    })

    // heapdump.writeSnapshot('heap2.heapsnapshot', (err, filename) => {
    //   if (err) throw err
    //   console.log(`[heapdump] Snapshot written to: ${filename}`)
    // })
  })
  // async function resolveComponent(component: ComponentObject) {
  //   const page = nui.createPage({
  //     name: 'Hello',
  //     viewport: { width: 375, height: 667 },
  //   })
  //   nui.use({
  //     getAssetsUrl: () => assetsUrl,
  //     getBaseUrl: () => baseUrl,
  //     getRoot: () => _root as Record<string, any>,
  //     getPreloadPages: () => [],
  //     getPages: () => u.keys(_root || {}),
  //     transaction: {
  //       async [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT](page: NuiPage) {
  //         if (!page.page) throw new Error(`[test-utils] page.page is empty`)
  //         return _root?.[page?.page]
  //       },
  //     },
  //   })

  //   return {
  //     component: await nui.resolveComponents({ components: component, page }),
  //     page,
  //   }
  // }
})
