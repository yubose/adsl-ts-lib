import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import y from 'yaml'
import { parseAs } from '../utils/yml'
import {
  baseUrl,
  createConfig,
  MockFileSystemHost,
  mockPaths,
  nockCadlEndpointRequest,
} from './helpers'
import Loader, { LoadConfigOptions } from '../loader'
import * as c from '../constants'
import * as t from '../types'

let configKey = 'www'
let mfs: MockFileSystemHost

let loader: Loader

beforeEach(() => {
  loader = getLoader()
})

const getLoader = () => {
  const loader = new Loader()
  loader.config.configKey = configKey
  loader.config.rootConfigUrl = c.baseRemoteConfigUrl
  loader.config.set('cadlBaseUrl', baseUrl)
  loader.config.set('cadlMain', 'cadlEndpoint.yml')
  loader.use((mfs = new MockFileSystemHost()))
  return loader
}

describe(`Loader`, () => {
  describe(`loadConfig`, () => {
    for (const { mode, value } of [
      { value: configKey, mode: 'file' },
      { value: configKey, mode: 'url' },
      { value: configKey },
    ]) {
      if (!mode) {
        const label = mode === 'file' ? 'file path' : 'url'

        it(`should load the config by ${label} if config name is provided and mode is ${mode}`, async () => {
          mockPaths({ configKey: value, type: mode as t.LoadType })
          const dir = `generated/${value}`
          await loader.loadConfig(value, { dir })
          expect(loader.appKey).to.eq('cadlEndpoint.yml')
        })

        if (mode === 'file') {
          it(`should throw if options.dir is empty`, async () => {
            expect(loader.load).to.eventually.not.be.rejectedWith(
              /Directory not provided/i,
            )
          })
        }
      } else {
        it(`should load the config by url if mode is missing and config name was provided`, async () => {
          mockPaths({ configKey: value, type: 'url' })
          await loader.loadConfig(value)
          expect(loader.appKey).to.eq('cadlEndpoint.yml')
        })
      }
    }

    it(`should load props on the Config instance`, async () => {
      const assetsUrl = 'https://abc.com/assets'
      const baseUrl = 'https://abc.com/'

      const mockResults = mockPaths({
        assetsUrl,
        baseUrl,
        configKey: [
          configKey,
          createConfig({
            apiHost: 'topo.aitmed.io',
            apiPort: '993',
            cadlBaseUrl: baseUrl,
            webApiHost: 'webApiHost123',
            appApiHost: 'appApiHost123',
          }),
        ],
        preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
        pages: ['SignIn', ['Dashboard', { components: [] }]],
        type: 'url',
      })

      const loader = new Loader()

      expect(loader.config.appKey).to.eq('')
      expect(loader.config.get('apiHost')).to.be.undefined
      expect(loader.config.get('apiPort')).to.be.undefined
      expect(loader.config.get('cadlBaseUrl')).to.be.undefined
      expect(loader.config.get('timestamp')).to.be.undefined

      loader.config.configKey = configKey

      await loader.loadConfig(configKey, { dir: `generated/${configKey}` })

      expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
      expect(loader.config.get('apiHost')).to.eq('topo.aitmed.io')
      expect(loader.config.get('apiPort')).to.eq('993')
      expect(loader.config.get('webApiHost')).to.eq('webApiHost123')
      expect(loader.config.get('appApiHost')).to.eq('appApiHost123')
      expect(loader.config.get('cadlBaseUrl')).to.eq(baseUrl)
      expect(loader.config.get('cadlMain')).to.eq('cadlEndpoint.yml')
    })
  })

  describe(`loadCadlEndpoint`, () => {
    for (const loadType of ['yml', 'doc', 'json']) {
      const assetsUrl = 'https://abc.com/assets'
      const baseUrl = 'https://abc.com/'
      const label = loadType === 'doc' ? 'a yaml doc' : loadType

      describe(`when providing ${label}`, () => {
        for (const mode of ['file', 'url'] as const) {
          const isUrl = mode === 'url'
          let endpoint = ''
          let yml = ''

          beforeEach(() => {
            const mockResult = mockPaths({
              assetsUrl,
              baseUrl,
              configKey,
              preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
              pages: ['SignIn', ['Dashboard', { components: [] }]],
              type: mode,
            })

            endpoint = u
              .keys(mockResult[isUrl ? 'endpoints' : 'paths'])
              .find((endpoint) =>
                endpoint.includes('cadlEndpoint.yml'),
              ) as string

            yml = mockResult[isUrl ? 'endpoints' : 'paths']?.[endpoint]

            nockCadlEndpointRequest({
              assetsUrl,
              baseUrl,
              preload: ['BasePage', 'BaseCSS'],
              pages: ['SignIn', 'Dashboard'],
            })
          })

          it(`should load the props on the CadlEndpoint instance`, async () => {
            expect(loader.cadlEndpoint.get('assetsUrl')).to.be.undefined
            expect(loader.cadlEndpoint.get('baseUrl')).to.be.undefined
            expect(loader.cadlEndpoint.get('fileSuffix')).to.be.undefined
            expect(loader.cadlEndpoint.get('languageSuffix')).to.be.undefined

            const value = parseAs(
              label.includes('doc')
                ? 'doc'
                : label.includes('json')
                ? 'json'
                : 'yml',
              yml,
            )

            const cadlEndpoint = loader.cadlEndpoint

            expect(cadlEndpoint.assetsUrl).to.eq('')
            expect(cadlEndpoint.baseUrl).to.eq('')
            expect(cadlEndpoint.startPage).to.eq('')
            expect(cadlEndpoint.get('preload')).to.be.undefined
            expect(cadlEndpoint.get('page')).to.be.undefined
            expect(loader.cadlEndpoint.getPreload()).to.have.lengthOf(0)
            expect(loader.cadlEndpoint.getPages()).to.have.lengthOf(0)

            const loadOptions = {
              mode,
            } as LoadConfigOptions

            if (mode === 'file') {
              loadOptions.dir = `generated/${configKey}`
              loadOptions.fs = new MockFileSystemHost()
            }

            await loader.loadCadlEndpoint(value, loadOptions)

            expect(loader.cadlEndpoint.assetsUrl).to.eq(assetsUrl)
            expect(loader.cadlEndpoint.baseUrl).to.eq(baseUrl)
            expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
            expect(loader.cadlEndpoint.getPreload()).to.include.all.members([
              'BasePage',
              'BaseCSS',
            ])
            expect(loader.cadlEndpoint.getPages()).to.include.all.members([
              'SignIn',
              'Dashboard',
            ])
            expect(cadlEndpoint.get('preload')).to.be.an('array')
            expect(cadlEndpoint.get('page')).to.be.an('array')
          })
        }

        it(`should load from remote URL if no arguments are provided`, async () => {
          mockPaths({
            configKey,
            preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
            type: 'url',
          })
          await loader.loadConfig(configKey)
          await loader.loadCadlEndpoint()
          const cadlEndpoint = loader.cadlEndpoint
          expect(cadlEndpoint).to.have.property('assetsUrl', assetsUrl)
          expect(cadlEndpoint).to.have.property('baseUrl', baseUrl)
          expect(cadlEndpoint.getPreload()).to.include.all.members([
            'BasePage',
            'BaseCSS',
          ])
        })
      })
    }
  })

  describe(`load`, () => {
    describe(`when given a name from preload`, () => {
      it(`should load from remote url using cadlEndpoint's baseUrl when options.mode !== 'file'`, async () => {
        mockPaths({
          configKey,
          preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
          type: 'url',
        })

        await loader.loadConfig(configKey)
        await loader.loadCadlEndpoint()
        await loader.load('BaseCSS')
        await loader.load('BasePage')
        expect(loader.root).to.have.property('Style')
        expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
        expect(loader.root.Style.get('top')).to.eq('0.1')
        expect(loader.root).not.to.have.property('BaseCSS')
        expect(loader.root).not.to.have.property('BasePage')
      })

      it(`should load from file system using options.dir when options.mode === 'file'`, async () => {
        mockPaths({
          configKey,
          preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
          type: 'file',
        })

        const loadOpts = {
          dir: `generated/${configKey}`,
          mode: 'file',
        } as const

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('BaseCSS', loadOpts)
        await loader.load('BasePage', loadOpts)
        expect(loader.root).to.have.property('Style')
        expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
        expect(loader.root.Style.get('top')).to.eq('0.1')
        expect(loader.root).not.to.have.property('BaseCSS')
        expect(loader.root).not.to.have.property('BasePage')
      })

      it(`should not spread the props if options.spread === false`, async () => {
        mockPaths({
          configKey,
          preload: ['BasePage', ['BaseCSS', { Style: { top: '0.1' } }]],
          type: 'file',
        })

        const loadOpts = {
          dir: `generated/${configKey}`,
          mode: 'file',
          spread: false,
        } as const

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('BaseCSS', loadOpts)
        await loader.load('BasePage', loadOpts)
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).to.have.property('BaseCSS')
        expect(loader.root).to.have.property('BasePage')
      })
    })

    describe(`when given a page from page list`, () => {
      it(`should set the page name as its key in the root`, async () => {
        mockPaths({
          configKey,
          pages: ['SignIn', ['Dashboard', { components: [] }]],
          type: 'file',
        })

        const loadOpts = {
          dir: `generated/${configKey}`,
          mode: 'file',
          spread: false,
        } as const

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('SignIn', loadOpts)
        await loader.load('Dashboard', loadOpts)
        expect(loader.root).to.have.property('SignIn')
        expect(loader.root).to.have.property('Dashboard')
      })

      it(`should set each page as a yaml document`, async () => {
        mockPaths({
          configKey,
          pages: ['SignIn', ['Dashboard', { components: [] }]],
          type: 'file',
        })

        const loadOpts = {
          dir: `generated/${configKey}`,
          mode: 'file',
        } as const

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('SignIn', loadOpts)
        await loader.load('Dashboard', loadOpts)
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        expect(loader.root.Dashboard).to.be.instanceOf(y.Document)
      })

      it(`should load from remote url using cadlEndpoint's baseUrl when options.mode !== 'file'`, async () => {
        const mockResults = mockPaths({
          configKey,
          pages: ['SignIn', ['Dashboard', { components: [] }]],
          type: 'url',
        })

        const loadOpts = {} as const

        u.keys(mockResults.endpoints).forEach((key) => {
          expect(key?.startsWith('http')).to.be.true
        })

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('SignIn', loadOpts)
        await loader.load('Dashboard', loadOpts)
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        expect(loader.root.Dashboard).to.be.instanceOf(y.Document)
      })

      it(`should load from file system using options.dir when options.mode === 'file'`, async () => {
        const mockResults = mockPaths({
          configKey,
          pages: ['SignIn', ['Dashboard', { components: [] }]],
          type: 'file',
        })

        const loadOpts = {
          dir: `generated/${configKey}`,
          mode: 'file',
        } as const

        u.keys(mockResults.endpoints).forEach((key) => {
          expect(key?.startsWith('generated')).to.be.true
        })

        await loader.loadConfig(configKey, loadOpts)
        await loader.loadCadlEndpoint({ ...loadOpts })
        await loader.load('SignIn', loadOpts)
        await loader.load('Dashboard', loadOpts)
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        expect(loader.root.Dashboard).to.be.instanceOf(y.Document)
      })
    })
  })
})
