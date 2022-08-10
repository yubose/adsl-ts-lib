import * as R from 'ramda'
import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { fs, vol } from 'memfs'
import nock from 'nock'
import y from 'yaml'
import { toDocument } from '../utils/yml'
import {
  baseUrl,
  createConfig,
  createCadlEndpoint,
  getLoadFileOptions,
  MockFileSystemHost,
  mockPaths,
  nockRequest,
  nockCadlEndpointRequest,
  readFile,
} from './helpers'
import Loader from '../loader'
import type { LoadType } from '../loader/loader-types'
import * as c from '../constants'
import * as t from '../types'

const configKey = 'www'
let mockFs: MockFileSystemHost

const getLoader = (configKey = 'meetd2') => {
  mockFs = new MockFileSystemHost()
  const loader = new Loader()
  loader.config.configKey = configKey
  loader.config.set('cadlBaseUrl', baseUrl)
  loader.config.set('cadlMain', 'cadlEndpoint.yml')
  loader.use(mockFs)
  return loader
}

let loader: Loader

before(() => {
  process.stdout.write('\x1Bc')
})

beforeEach(() => {
  loader = getLoader(configKey)
})

afterEach(() => {
  nock.cleanAll()
})

xit(`ramda`, () => {
  const extractName = (arr) => arr[0]
  const result = R.either(extractName, R.identity)
})

describe(`Loader`, () => {
  describe(`loadConfig`, () => {})

  describe(`load`, () => {
    describe(`loadConfig`, () => {
      it.only(`should load using the current configKey if argument is an options object`, async () => {
        const mockResults = mockPaths({ configKey, type: 'file' })
        console.log(mockResults)

        const loader = new Loader()
        loader.config.configKey = configKey
        expect(loader.appKey).to.eq('')
        await loader.loadConfig(configKey, {
          dir: `generated/${configKey}`,
          mode: 'file',
        })
        expect(loader.appKey).to.eq('cadlEndpoint.yml')
      })

      xit(`should load using the provided configKey and update the configKey on the instance`, () => {
        //
      })

      describe(`when mode !== 'file'`, () => {
        xit(`should populate the Config instance`, async () => {
          await loader.loadConfig('meetd2')
        })

        xit(`should set the appKey`, () => {
          //
        })

        it(`should load the whole app if given just the configKey`, async () => {
          mockPaths({
            type: 'url',
            configKey: ['meetd2', createConfig({ cadlBaseUrl: baseUrl })],
            preload: [['BaseCSS', { Style: { top: '0.2' } }]],
            pages: [
              'SignIn',
              ['Dashboard', { components: [{ type: 'button', id: 'myBtn' }] }],
            ],
          })
          await loader.load('meetd2')
          expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
          expect(loader.root).to.have.property('Style').to.be.an('object')
          expect(loader.root)
            .to.have.property('SignIn')
            .to.be.instanceOf(y.Document)
          expect(loader.root)
            .to.have.property('Dashboard')
            .to.be.instanceOf(y.Document)
        })
      })

      it(`should load the config using rootConfigUrl + configKey if mode !== 'file'`, async () => {
        const { endpoint } = nockCadlEndpointRequest()
        expect(loader.config.appKey).to.eq('')
        await loader.load('meetd2')
        expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
      })

      it(`should load the config using dir + configKey if mode === 'file'`, async () => {
        console.log(
          mockPaths({
            configKey: [configKey, createConfig({ apiHost: 'abc123' })],
            preload: [['BaseCSS', { HelloStyle: {} }]],
          }),
        )

        expect(loader.config.get('apiHost')).to.be.undefined
        await loader.load('meetd2', getLoadFileOptions())
        expect(loader.config.get('apiHost')).to.eq('abc123')
      })

      it(`should load the config by filepath when given the config key and if mode === 'file' and directory is provided`, async () => {
        nockRequest(
          baseUrl,
          'cadlEndpoint.yml',
          createCadlEndpoint({ preload: [], pages: [] }),
        )
        expect(loader.config.appKey).to.eq('')
        await loader.load('meetd2')
        expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
      })

      for (const loadType of ['file'] as LoadType[]) {
        xit(
          `should proceed to load cadlEndpoint when loading config by ` +
            loadType ===
            ''
            ? 'name'
            : loadType,
          async () => {
            const configKey = loader.config.configKey
            loader.config.set('cadlBaseUrl', baseUrl)
            const preload = ['BaseCSS', 'BasePage']
            const pages = ['SignIn', 'Dashboard']

            mockPaths({
              type: loadType,
              baseUrl,
              configKey: [configKey, createConfig()],
              preload,
              pages,
            })

            expect(loader.cadlEndpoint.getPreload()).to.have.lengthOf(0)
            expect(loader.cadlEndpoint.getPages()).to.have.lengthOf(0)

            await loader.load(
              loadType === 'file'
                ? `generated/${configKey}/${configKey}.yml`
                : configKey,
              loadType === 'file' ? getLoadFileOptions() : undefined,
            )

            expect(loader.cadlEndpoint.getPreload()).to.include.members([
              'BaseCSS',
              'BasePage',
            ])

            expect(loader.cadlEndpoint.getPages()).to.include.members([
              'SignIn',
              'Dashboard',
            ])
          },
        )
      }
    })

    describe(`when loading preload`, () => {
      // it(`should not proceed to load preload if includePreload === false`, async () => {
      //   nockRequest(
      //     baseUrl,
      //     'cadlEndpoint.yml',
      //     createCadlEndpoint({ preload: ['BaseCSS', 'BasePage'] }),
      //   )
      //   nockRequest(
      //     baseUrl,
      //     'BaseCSS.yml',
      //     y.stringify({
      //       Style: { top: '0.2' },
      //       HeaderStyle: { marginTop: 'auto', shadow: 'true' },
      //     }),
      //   )
      //   nockRequest(
      //     baseUrl,
      //     'BasePage.yml',
      //     y.stringify({
      //       pageName: 'BasePage',
      //       BaseButton: { text: 'submit' },
      //       BaseHeader: null,
      //       ButtonCancel: { '.BaseButton': null, text: 'cancel' },
      //     }),
      //   )
      //   expect(loader.root).not.to.have.property('Style')
      //   expect(loader.root).not.to.have.property('HeaderStyle')
      //   expect(loader.root).not.to.have.property('pageName')
      //   expect(loader.root).not.to.have.property('BaseButton')
      //   expect(loader.root).not.to.have.property('BaseHeader')
      //   expect(loader.root).not.to.have.property('ButtonCancel')
      //   await loader.load('meetd2')
      //   expect(loader.root).to.have.property('Style')
      //   expect(loader.root).to.have.property('HeaderStyle')
      //   expect(loader.root).to.have.property('pageName')
      //   expect(loader.root).to.have.property('BaseButton')
      //   expect(loader.root).to.have.property('BaseHeader')
      //   expect(loader.root).to.have.property('ButtonCancel')
      // })
      // it(`should not proceed to load pages if includePages === false`, async () => {
      //   nockRequest(
      //     baseUrl,
      //     'cadlEndpoint.yml',
      //     createCadlEndpoint({ pages: ['SignIn', 'Dashboard'] }),
      //   )
      //   nockRequest(
      //     baseUrl,
      //     'SignIn.yml',
      //     y.stringify({ SignIn: { components: [] } }),
      //   )
      //   nockRequest(
      //     baseUrl,
      //     'Dashboard.yml',
      //     y.stringify({
      //       Dashboard: { components: [{ type: 'button', text: 'Submit' }] },
      //     }),
      //   )
      //   expect(loader.root).not.to.have.property('SignIn')
      //   expect(loader.root).not.to.have.property('Dashboard')
      //   await loader.load('meetd2')
      //   expect(loader.root).to.have.property('SignIn')
      //   expect(loader.root).to.have.property('Dashboard')
      // })
    })

    describe(`when string is a value from preload list`, () => {
      it(`should spread the preload item to root from name`, async () => {
        const loader = new Loader()
        const yml = y.stringify({
          Style: { top: '0.1' },
          HeaderStyle: { color: '0x033000' },
        })
        nockRequest(`https://google.com/`, 'BaseCSS.yml', yml)
        loader.cadlEndpoint.getPreload().push('BaseCSS')
        loader.cadlEndpoint.set('baseUrl', 'https://google.com/')
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).not.to.have.property('HeaderStyle')
        await loader.load('BaseCSS')
        expect(loader.root).to.have.property('Style')
        expect(loader.root).to.have.property('HeaderStyle')
        expect(loader.root).to.have.property('HeaderStyle')
        expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
        expect(loader.root.HeaderStyle).to.be.instanceOf(y.YAMLMap)
      })

      it(`should spread the preload item to root from url`, async () => {
        const loader = new Loader()
        const yml = y.stringify({
          Style: { top: '0.1' },
          HeaderStyle: { color: '0x033000' },
        })
        nockRequest(`https://google.com/`, 'BaseCSS.yml', yml)
        loader.cadlEndpoint.getPreload().push('BaseCSS')
        loader.cadlEndpoint.set('baseUrl', 'https://google.com/')
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).not.to.have.property('HeaderStyle')
        await loader.load('https://google.com/BaseCSS.yml')
        expect(loader.root).to.have.property('Style')
        expect(loader.root).to.have.property('HeaderStyle')
        expect(loader.root).to.have.property('HeaderStyle')
        expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
        expect(loader.root.HeaderStyle).to.be.instanceOf(y.YAMLMap)
      })

      it(`should spread the preload item to root from file path`, async () => {
        vol.fromJSON({
          './generated/meetd2/BaseCSS.yml': y.stringify({
            Style: { top: '0.1' },
            HeaderStyle: { color: '0x033000' },
          }),
        })
        const loader = new Loader()
        loader.cadlEndpoint.getPreload().push('BaseCSS')
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).not.to.have.property('HeaderStyle')
        await loader.load(
          './generated/meetd2/BaseCSS.yml',
          getLoadFileOptions(),
        )
        expect(loader.root).to.have.property('Style')
        expect(loader.root).to.have.property('HeaderStyle')
        expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
        expect(loader.root.HeaderStyle).to.be.instanceOf(y.YAMLMap)
      })
    })

    describe(`when string is a value from page list`, () => {
      it(`should load the page to root from page name`, async () => {
        nockRequest(`https://google.com/`, 'SignIn.yml', 'SignIn:\n')
        const loader = new Loader()
        loader.cadlEndpoint.getPages().push('SignIn')
        loader.cadlEndpoint.set('baseUrl', 'https://google.com/')
        expect(loader.root).not.to.have.property('SignIn')
        await loader.load('SignIn')
        expect(loader.root).to.have.property('SignIn')
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
      })

      it(`should load the page to root from page url`, async () => {
        nockRequest(`https://google.com/`, 'SignIn.yml', 'SignIn:\n')
        const loader = new Loader()
        loader.cadlEndpoint.getPages().push('SignIn')
        loader.cadlEndpoint.set('baseUrl', 'https://google.com/')
        expect(loader.root).not.to.have.property('SignIn')
        await loader.load('https://google.com/SignIn.yml')
        expect(loader.root).to.have.property('SignIn')
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
      })

      it(`should load the page to root from filepath`, async () => {
        const loader = new Loader()
        loader.cadlEndpoint.getPages().push('SignIn')
        expect(loader.root).not.to.have.property('SignIn')
        await loader.load('./generated/meetd2/SignIn.yml', getLoadFileOptions())
        expect(loader.root).to.have.property('SignIn')
        expect(loader.root.SignIn).to.be.instanceOf(y.Document)
      })
    })
  })

  for (const loadType of ['url', 'file']) {
    describe(`when loading by ${loadType}`, () => {
      const isLoadFile = loadType === 'file'
      const baseConfigUrl = 'https://public.aitmed.com/config'
      const baseAppUrl = `http://127.0.0.1:3001/`
      const configKey = 'meetd2'
      const pathToConfig = isLoadFile
        ? `./generated/${configKey}/${configKey}.yml`
        : `${baseConfigUrl}/${configKey}.yml`

      describe(`when loading config props`, () => {
        it(`should load root config props`, async () => {
          const loader = new Loader()
          loader.config.configKey = configKey
          mockPaths({
            type: loadType as LoadType,
            configKey: [
              configKey,
              createConfig({
                apiHost: 'albh2.aitmed.io',
                apiPort: '443',
                webApiHost: 'apiHost',
                appApiHost: 'apiHost',
                viewWidthHeightRatio: { min: 0.56, max: 0.7 },
                loadingLevel: 1,
                cadlBaseUrl: baseAppUrl,
                timestamp: 5272021,
              }),
            ],
          })
          expect(loader.config.get('apiHost')).to.be.undefined
          expect(loader.config.get('apiPort')).to.be.undefined
          await loader.load(
            pathToConfig,
            isLoadFile ? getLoadFileOptions() : undefined,
          )
          expect(loader.config.get('apiHost')).to.eq('albh2.aitmed.io')
          expect(loader.config.get('apiPort')).to.eq('443')
          expect(loader.config.get('viewWidthHeightRatio')).to.have.property(
            'min',
            0.56,
          )
          expect(loader.config.get('viewWidthHeightRatio')).to.have.property(
            'max',
            0.7,
          )
          expect(loader.config.get('webApiHost')).to.eq('apiHost')
          expect(loader.config.get('appApiHost')).to.eq('apiHost')
          expect(loader.config.get('loadingLevel')).to.eq(1)
          expect(loader.config.get('cadlBaseUrl')).to.eq(baseAppUrl)
          expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
          expect(loader.config.get('timestamp')).to.eq(5272021)
        })
      })

      it.skip(`should load app config props`, async () => {
        const preload = ['BasePage', 'BaseCSS', 'BaseDataModel']
        const pages = [
          'AboutAitmed',
          'AddContact',
          'DocumentNotes',
          'EditContact',
          'ReferenceTest',
        ]
        if (isLoadFile) {
          vol.fromJSON({
            [`generated/${configKey}/${configKey}.yml`]: y.stringify({
              apiHost: 'albh2.aitmed.io',
              apiPort: '443',
              viewWidthHeightRatio: { min: 0.56, max: 0.7 },
              webApiHost: 'apiHost',
              appApiHost: 'apiHost',
              loadingLevel: 1,
              cadlBaseUrl: baseAppUrl,
              cadlMain: 'cadlEndpoint.yml',
              timestamp: 5272021,
            }),
            [`generated/${configKey}/cadlEndpoint.yml`]: createCadlEndpoint({
              assetsUrl: `\${cadlBaseUrl}assets/`,
              baseUrl: `\${cadlBaseUrl}`,
            }),
            ...preload.reduce(
              (acc, name) =>
                Object.assign(acc, {
                  [`generated/${configKey}/${name}.yml`]: '',
                }),
              {},
            ),
            ...pages.reduce(
              (acc, name) =>
                Object.assign(acc, {
                  [`generated/${configKey}/${name}.yml`]: '',
                }),
              {},
            ),
          })
        } else {
          nockRequest(
            c.baseRemoteConfigUrl,
            'meetd2.yml',
            y.stringify({
              apiHost: 'albh2.aitmed.io',
              apiPort: "'443'",
              cadlBaseUrl: baseAppUrl,
              cadlMain: 'cadlEndpoint.yml',
            }),
          )
          nockRequest(baseAppUrl, 'cadlEndpoint.yml', createCadlEndpoint())
        }
        const loader = new Loader()
        loader.config.configKey = configKey

        if (isLoadFile) {
          await loader.load(pathToConfig, getLoadFileOptions())
          await loader.load(
            `./generated/${configKey}/cadlEndpoint.yml`,
            getLoadFileOptions(),
          )
        } else {
          await loader.load(pathToConfig)
          await loader.load(`${baseAppUrl}cadlEndpoint.yml`)
        }

        expect(loader.cadlEndpoint.assetsUrl).to.eq(`\${cadlBaseUrl}assets/`)
        expect(loader.cadlEndpoint.baseUrl).to.eq(`\${cadlBaseUrl}`)
        expect(loader.cadlEndpoint.get('languageSuffix')).to.be.an('object')
        expect(loader.cadlEndpoint.get('fileSuffix')).to.eq('.yml')
        expect(loader.cadlEndpoint.startPage).to.eq('SignIn')
        expect(loader.cadlEndpoint.getPreload()).to.include.members(preload)
        expect(loader.cadlEndpoint.getPages()).to.include.members(pages)
      })

      it(`should load preload files and spread their key/values to root`, async () => {
        const pages = [
          'AboutAitmed',
          'AddContact',
          'DocumentNotes',
          'EditContact',
          'ReferenceTest',
        ]

        const baseCssYml = y.stringify({
          Style: {},
          ImageStyle: {},
          LabelStyle: {},
        })

        const mockedResults = mockPaths({
          type: loadType as LoadType,
          baseUrl: baseUrl,
          configKey,
          preload: ['BasePage', 'BaseDataModel', ['BaseCSS', baseCssYml]],
          pages,
        })

        console.dir({ mockedResults }, { depth: Infinity })

        const loadOptions = isLoadFile ? getLoadFileOptions() : undefined
        const loader = new Loader()
        loader.config.configKey = configKey
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).not.to.have.property('ImageStyle')
        expect(loader.root).not.to.have.property('LabelStyle')

        await loader.load(pathToConfig, loadOptions)
        expect(loader.root).to.have.property('Style')
        expect(loader.root).to.have.property('ImageStyle')
        expect(loader.root).to.have.property('LabelStyle')
      })

      it.skip(`should load page files by ${loadType}`, async () => {
        const preload = ['BasePage', 'BaseCSS', 'BaseDataModel']
        const pages = [
          'AddContact',
          'AboutAitmed',
          'DocumentNotes',
          'EditContact',
          'ReferenceTest',
        ]
        if (isLoadFile) {
          vol.fromJSON(
            getMockedFileLoadingPaths({
              configKey,
              preload,
              pages,
            }),
          )
        } else {
          nockRequest(c.baseRemoteConfigUrl, `${configKey}.yml`, createConfig())
          nockRequest(
            baseUrl,
            'cadlEndpoint.yml',
            createCadlEndpoint({ preload, pages }),
          )
          preload.forEach((p) => nockRequest(baseUrl, `${p}.yml`, ''))
          pages.forEach((p) => nockRequest(baseUrl, `${p}.yml`, ''))
        }
        const loadOptions =
          loadType === 'file' ? getLoadFileOptions() : undefined
        const loader = new Loader()
        loader.config.configKey = configKey
        expect(loader.root).not.to.have.property('AboutAitmed')
        expect(loader.root).not.to.have.property('EditContact')
        expect(loader.root).not.to.have.property('ReferenceTest')
        await loader.load(pathToConfig, loadOptions)
        expect(loader.root).to.have.property('AboutAitmed')
        expect(loader.root).to.have.property('EditContact')
        expect(loader.root).to.have.property('ReferenceTest')
      })
    })

    describe.skip(`when extracting assets`, () => {
      it(`should be able to extract all image assets`, () => {
        const loader = new Loader()
        loader.use(new ExtractImage())
        const yml = `
SignIn:
  formData:
    avatar: abc.png
    documents:
      - license.pdf
      - registration.jpg
      - name: thumbnail
        link: https://www.aitmed.com/cadl/wwwv4.16/fish123.svg
  components:
    - type: scrollView
      children:
        - type: view
          children:
            - type: image
              path: food.png
            - type: scrollView
              children:
                - type: image
                  path: hello.jpeg
                - type: video
                  path: rollercoaster.mp4
                - type: page
                  path: Dashboard
`
        const doc = toDocument(yml)
        const imageExtractor = new ExtractImage()
        const extractedImages = loader.extract(doc, {
          use: {
            extractors: [{ name: 'images', extractor: imageExtractor }],
          },
        })
        console.log(extractedImages)
      })
    })
  }
})
