import * as u from '@jsmanifest/utils'
import { fs, vol } from 'memfs'
import y from 'yaml'
import path from 'path'
import { expect } from 'chai'
import nock from 'nock'
import { defaultBaseUrl, getFixturePath, proxyPageYmls } from './test-utils'
import { loadMockedFixtures } from './helpers'
import Loader, { FileStrategy, UrlStrategy } from '../loader'
import Config from '../config'
import CadlEndpoint from '../cadlendpoint'
import { toDocument } from '../utils/yml'
import { nockUrlRequest } from './helpers'
import * as c from '../constants'

const readFile = (fp: string) => {
  return new Promise((resolve) => {
    fs.readFile(fp, resolve)
  })
}

beforeEach(() => {
  loadMockedFixtures()
})

afterEach(() => {
  nock.cleanAll()
})

describe.only(`Loader`, () => {
  describe(`load`, () => {
    describe(`when given a string`, () => {
      describe(`when string is the config key`, () => {
        xit(`should load the config`, async () => {
          const config = new Config()
          const loader = new Loader()
          config.baseUrl = 'https://google.com/'
          nockUrlRequest(
            c.baseRemoteConfigUrl,
            'meetd2.yml',
            y.stringify(config),
          )
          loader.config.configKey = 'meetd2'
          await loader.load('meetd2')
          console.log(loader)
          expect(loader.cadlEndpoint.baseUrl).to.eq(config.baseUrl)
        })
      })

      describe.only(`when string is a value from preload list`, () => {
        it(`should spread the preload item to root from name`, async () => {
          const loader = new Loader()
          const yml = y.stringify({
            Style: { top: '0.1' },
            HeaderStyle: { color: '0x033000' },
          })
          nockUrlRequest(`https://google.com/`, 'BaseCSS.yml', yml)
          loader.cadlEndpoint.preload.push('BaseCSS')
          loader.cadlEndpoint.baseUrl = 'https://google.com/'
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
          nockUrlRequest(`https://google.com/`, 'BaseCSS.yml', yml)
          loader.cadlEndpoint.preload.push('BaseCSS')
          loader.cadlEndpoint.baseUrl = 'https://google.com/'
          expect(loader.root).not.to.have.property('Style')
          expect(loader.root).not.to.have.property('HeaderStyle')
          await loader.load('https://google.com/BaseCSS.yml')
          expect(loader.root).to.have.property('Style')
          expect(loader.root).to.have.property('HeaderStyle')
          expect(loader.root).to.have.property('HeaderStyle')
          expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
          expect(loader.root.HeaderStyle).to.be.instanceOf(y.YAMLMap)
        })

        it.only(`should spread the preload item to root from file path`, async () => {
          const yml = y.stringify({
            Style: { top: '0.1' },
            HeaderStyle: { color: '0x033000' },
          })
          const loader = new Loader()
          loader.cadlEndpoint.preload.push('BaseCSS')
          loader.cadlEndpoint.baseUrl = 'https://google.com/'
          expect(loader.root).not.to.have.property('Style')
          expect(loader.root).not.to.have.property('HeaderStyle')
          await loader.load('./generated/meetd2/BaseCSS.yml', {
            fs: { ...fs, readFile },
            mode: 'file',
          })
          expect(loader.root).to.have.property('Style')
          expect(loader.root).to.have.property('HeaderStyle')
          expect(loader.root.Style).to.be.instanceOf(y.YAMLMap)
          expect(loader.root.HeaderStyle).to.be.instanceOf(y.YAMLMap)
        })
      })

      describe(`when string is a value from page list`, () => {
        it(`should load the page to root from page name`, async () => {
          nockUrlRequest(`https://google.com/`, 'SignIn.yml', 'SignIn:\n')
          const loader = new Loader()
          loader.cadlEndpoint.pages.push('SignIn')
          loader.cadlEndpoint.baseUrl = 'https://google.com/'
          expect(loader.root).not.to.have.property('SignIn')
          await loader.load('SignIn')
          expect(loader.root).to.have.property('SignIn')
          expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        })

        it(`should load the page to root from page url`, async () => {
          nockUrlRequest(`https://google.com/`, 'SignIn.yml', 'SignIn:\n')
          const loader = new Loader()
          loader.cadlEndpoint.pages.push('SignIn')
          loader.cadlEndpoint.baseUrl = 'https://google.com/'
          expect(loader.root).not.to.have.property('SignIn')
          await loader.load('https://google.com/SignIn.yml')
          expect(loader.root).to.have.property('SignIn')
          expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        })

        it(`should load the page to root from filepath`, async () => {
          const loader = new Loader()
          loader.cadlEndpoint.pages.push('SignIn')
          expect(loader.root).not.to.have.property('SignIn')
          await loader.load('./generated/meetd2/SignIn.yml', {
            fs: { ...fs, readFile },
            mode: 'file',
          })
          expect(loader.root).to.have.property('SignIn')
          expect(loader.root.SignIn).to.be.instanceOf(y.Document)
        })
      })
    })
  })

  for (const loadType of ['url', 'file']) {
    describe(`when loading by ${loadType}`, () => {
      const getPath = (str: string) =>
        isLoadFile ? getFixturePath(str) : `${baseAppUrl}${str}`

      const isLoadFile = loadType === 'file'
      const baseConfigUrl = 'https://public.aitmed.com/config'
      const baseAppUrl = `http://127.0.0.1:3001/`
      const configKey = 'meetd2'
      const pathToConfig = isLoadFile
        ? getFixturePath(`${configKey}.yml`)
        : `${baseConfigUrl}/${configKey}.yml`

      beforeEach(() => {
        if (!isLoadFile) {
          proxyPageYmls({ baseUrl: baseConfigUrl, names: configKey })
        }
      })

      describe(`when loading config props`, () => {
        it.skip(`should load config if given config as ${loadType} path`, async () => {
          const loader = new Loader()
          loader.config.rootConfigUrl = 'https://public.aitmed.com/config'
          loader.config.configKey = 'meetd2'
          await loader.load('meetd2')
        })

        it.skip(`should load root config props`, async () => {
          const loader = new Loader()
          loader.config.configKey = configKey
          await loader.load(pathToConfig)
          expect(loader.config.apiHost).to.eq('albh2.aitmed.io')
          expect(loader.config.apiPort).to.eq('443')
          expect(loader.config.viewWidthHeightRatio).to.have.property(
            'min',
            0.56,
          )
          expect(loader.config.viewWidthHeightRatio).to.have.property(
            'max',
            0.7,
          )
          expect(loader.config.webApiHost).to.eq('apiHost')
          expect(loader.config.appApiHost).to.eq('apiHost')
          expect(loader.config).to.have.property('loadingLevel', 1)
          expect(loader.config.baseUrl).to.eq(baseAppUrl)
          expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
          expect(loader.config).to.have.property('timestamp').to.eq(5272021)
        })
      })

      it(`should load app config props`, async () => {
        if (!isLoadFile) {
          proxyPageYmls({ baseUrl: baseAppUrl, names: ['cadlEndpoint.yml'] })
        }
        const loader = new Loader()
        loader.config.configKey = configKey
        await loader.load(pathToConfig)
        await loader.load(getPath('cadlEndpoint.yml'))
        expect(loader.cadlEndpoint.assetsUrl).to.eq(`\${cadlBaseUrl}assets/`)
        expect(loader.cadlEndpoint.baseUrl).to.eq(`\${cadlBaseUrl}`)
        expect(loader.cadlEndpoint.languageSuffix).to.be.an('object')
        expect(loader.cadlEndpoint.fileSuffix).to.eq('.yml')
        expect(loader.cadlEndpoint.startPage).to.eq('SignIn')
        expect(loader.cadlEndpoint.preload).to.be.an('array')
        expect(loader.cadlEndpoint.pages).to.be.an('array')
        expect(loader.cadlEndpoint.preload).to.include.members([
          'BasePage',
          'BaseCSS',
          'BaseDataModel',
        ])
        expect(loader.cadlEndpoint.pages).to.include.members([
          'AboutAitmed',
          'AddContact',
          'DocumentNotes',
          'EditContact',
          'ReferenceTest',
        ])
      })

      it(`should load preload files and spread their key/values to root`, async () => {
        if (!isLoadFile) {
          proxyPageYmls({
            baseUrl: baseAppUrl,
            names: ['cadlEndpoint.yml', 'BaseCSS.yml'],
          })
        }
        const loader = new Loader()
        loader.config.configKey = configKey
        await loader.load(pathToConfig)
        await loader.load(getPath('cadlEndpoint.yml'))
        expect(loader.root).not.to.have.property('Style')
        expect(loader.root).not.to.have.property('ImageStyle')
        expect(loader.root).not.to.have.property('LabelStyle')
        await loader.load(getPath('BaseCSS.yml'))
        expect(loader.root).to.have.property('Style')
        expect(loader.root).to.have.property('ImageStyle')
        expect(loader.root).to.have.property('LabelStyle')
      })

      it(`should load page files by ${loadType}`, async () => {
        if (!isLoadFile) {
          proxyPageYmls({
            baseUrl: defaultBaseUrl,
            names: [
              'cadlEndpoint.yml',
              'AboutAitmed.yml',
              'EditContact.yml',
              'ReferenceTest.yml',
            ],
          })
        }
        const loader = new Loader()
        loader.config.configKey = configKey
        await loader.load(pathToConfig)
        await loader.load(getPath('cadlEndpoint.yml'))
        expect(loader.root).not.to.have.property('AboutAitmed')
        expect(loader.root).not.to.have.property('EditContact')
        expect(loader.root).not.to.have.property('ReferenceTest')
        await loader.load(getPath('AboutAitmed.yml'))
        await loader.load(getPath('EditContact.yml'))
        await loader.load(getPath('ReferenceTest.yml'))
        expect(loader.root).to.have.property('AboutAitmed')
        expect(loader.root).to.have.property('EditContact')
        expect(loader.root).to.have.property('ReferenceTest')
      })
    })

    describe(`when extracting assets`, () => {
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

  describe(`should be able to take the internal UrlStrategy to resolve remote urls`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`should be able to take the internal FileStrategy to resolve file paths`, () => {
    xit(``, () => {
      //
    })
  })
})
