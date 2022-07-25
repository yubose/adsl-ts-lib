import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import mfs from 'mock-fs'
import * as path from 'path'
import nock from 'nock'
import { defaultBaseUrl, getFixturePath, proxyPageYmls } from './test-utils'
import Loaderv2 from '../Loader'
import * as c from '../constants'

beforeEach(() => {
  mfs(
    {
      src: {
        __tests__: {
          fixtures: {
            'meetd2.yml': mfs.load(getFixturePath('meetd2.yml')),
            'cadlEndpoint.yml': mfs.load(getFixturePath('cadlEndpoint.yml')),
            'BaseCSS.yml': mfs.load(getFixturePath('BaseCSS.yml')),
            'BaseDataModel.yml': mfs.load(getFixturePath('BaseDataModel.yml')),
            'BasePage.yml': mfs.load(getFixturePath('BasePage.yml')),
            'DocumentNotes.yml': mfs.load(getFixturePath('DocumentNotes.yml')),
            'EditContact.yml': mfs.load(getFixturePath('EditContact.yml')),
            'EditMyDocument.yml': mfs.load(
              getFixturePath('EditMyDocument.yml'),
            ),
            'ReferenceTest.yml': mfs.load(getFixturePath('ReferenceTest.yml')),
            'SignIn.yml': mfs.load(getFixturePath('SignIn.yml')),
          },
        },
      },
      'package.json': mfs.load(path.join(process.cwd(), 'package.json')),
      'tsconfig.json': mfs.load(path.join(process.cwd(), 'tsconfig.json')),
    },
    { createCwd: true, createTmp: true },
  )
})

afterEach(() => {
  nock.cleanAll()
  mfs.restore()
})

describe.only(`Loaderv2`, () => {
  for (const loadType of ['url', 'file']) {
    describe(`when loading by file path`, () => {
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
          proxyPageYmls({ baseUrl: baseConfigUrl, names: `${configKey}.yml` })
        }
      })

      it(`should load root config props`, async () => {
        const loader = new Loaderv2()
        loader.config.configKey = configKey
        await loader.load(pathToConfig)
        expect(loader.config.apiHost).to.eq('albh2.aitmed.io')
        expect(loader.config.apiPort).to.eq('443')
        expect(loader.config.viewWidthHeightRatio).to.have.property('min', 0.56)
        expect(loader.config.viewWidthHeightRatio).to.have.property('max', 0.7)
        expect(loader.config.webApiHost).to.eq('apiHost')
        expect(loader.config.appApiHost).to.eq('apiHost')
        expect(loader.config).to.have.property('loadingLevel', 1)
        expect(loader.config.baseUrl).to.eq(baseAppUrl)
        expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
        expect(loader.config).to.have.property('timestamp').to.eq(5272021)
      })

      it(`should load app config props`, async () => {
        if (!isLoadFile) {
          proxyPageYmls({
            baseUrl: baseAppUrl,
            names: ['cadlEndpoint.yml'],
          })
        }
        const loader = new Loaderv2()
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
        const loader = new Loaderv2()
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
        const loader = new Loaderv2()
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
  }

  describe.only(`when extracting assets`, () => {
    it(`should extract all assets`, async () => {
      const loader = new Loaderv2()
      loader.config.configKey = 'meetd2'
      await loader.load('src/__tests__/fixtures/meetd2.yml')
      await loader.load('src/__tests__/fixtures/cadlEndpoint.yml')
      const assets = loader.extractor.extract(loader.root)
      console.log(assets)
    })
  })
})
