// import * as u from '@jsmanifest/utils'
// import { expect } from 'chai'
// import chalk from 'chalk'
// import fs from 'fs-extra'
// import * as path from 'path'
// import nock from 'nock'
// import sinon from 'sinon'
// import y from 'yaml'
// import { ensureExt } from 'noodl-file'
// import loadFiles from '../utils/loadFiles'
// import Loader from '../Loader'
// import loadFile from '../utils/loadFile'
// import * as c from '../constants'

// const meetd2yml = fs.readFileSync(path.join(__dirname, './fixtures/meetd2.yml'))
// const baseCssObject = loadFile(
//   path.join(__dirname, './fixtures/BaseCSS.yml'),
//   'json',
// )

// const config = 'meetd2'
// const pathToFixtures = path.join(__dirname, './fixtures')

// const loadYmlFactory =
//   (filename = '') =>
//   () =>
//     fs.readFileSync(
//       path.join(pathToFixtures, `${ensureExt(filename, 'yml')}`),
//       'utf8',
//     )

// const getRootConfigYml = loadYmlFactory(config)
// const getAppConfigYml = loadYmlFactory(`cadlEndpoint`)

// const rootConfig = y.parse(getRootConfigYml())
// const appConfig = y.parse(getAppConfigYml())
// const preloadPages = (appConfig.preload || []) as string[]
// const pages = (appConfig.page || []) as string[]
// const data = loadFiles(pathToFixtures, { as: 'object' })

// const mockAllPageRequests = (_loader = loader) => {
//   for (let page of [...preloadPages, ...pages] as string[]) {
//     page.startsWith('~/') && (page = page.replace('~/', ''))
//     nock(baseUrl).get(new RegExp(page, 'i')).reply(200, data[page])
//   }
// }

// let loader: Loader<typeof config, 'map'>
// let assetsUrl = `http://127.0.0.1:3001/assets/`
// let baseConfigUrl = `http://127.0.0.1:3001/config`
// let baseUrl = `http://127.0.0.1:3001/`

// beforeEach(() => {
//   loader = new Loader({ config: 'meetd2', loglevel: 'error' })
//   nock(baseConfigUrl).get('/meetd2.yml').reply(200, meetd2yml)
//   nock(baseUrl).get('/cadlEndpoint.yml').reply(200, getAppConfigYml())
// })

// afterEach(() => {
//   nock.cleanAll()
// })

// async function init(
//   _loader = loader as ConstructorParameters<typeof Loader>[0] | Loader,
// ) {
//   let options: ConstructorParameters<typeof Loader>[0]
//   if (!(_loader instanceof Loader)) {
//     options = _loader
//     _loader = new Loader(options)
//   }
//   return (_loader as Loader).init({
//     dir: pathToFixtures,
//     loadPages: false,
//     loadPreloadPages: false,
//     ...(u.isObj(options) ? options : { config: options }),
//   })
// }

// describe.skip(chalk.keyword('navajowhite')('noodl'), () => {
//   describe(`constructor`, () => {
//     it(`should construct without errors when given no args`, () => {
//       expect(() => new Loader()).to.not.throw()
//     })
//   })

//   describe(u.italic(`init`), () => {
//     describe(`when dataType is map`, () => {
//       beforeEach(() => {
//         loader = new Loader({ config: 'meetd2' })
//       })

//       it(`[map] should initiate both the root config and app config`, async () => {
//         await init()
//         const cadlEndpoint = loader.root.get('cadlEndpoint') as y.Document
//         const cadlMain = loader.root.get(config) as y.Document
//         expect(cadlMain.has('cadlMain')).to.be.true
//         expect(cadlEndpoint.has('preload')).to.be.true
//         expect(cadlEndpoint.has('page')).to.be.true
//       })

//       it(`[map] should set the root value as a yaml node`, async () => {
//         await init()
//         expect(y.isDocument(loader.root.get(config) as y.Document)).to.be.true
//       })
//     })

//     describe(`when dataType is object`, () => {
//       let loader: Loader<'meetd2', 'object'>

//       beforeEach(() => {
//         loader = new Loader({ config: 'meetd2', dataType: 'object' })
//       })

//       it(`[object] should initiate both the root config and app config`, async () => {
//         await init(loader)
//         const cadlEndpoint = loader.root.cadlEndpoint
//         const cadlMain = loader.root.meetd2
//         expect(cadlMain).to.have.property('cadlMain')
//         expect(cadlEndpoint).to.have.property('preload')
//         expect(cadlEndpoint).to.have.property('page')
//       })

//       it(`[object] should set root/app config as plain objects`, async () => {
//         await loader.init({ dir: pathToFixtures })
//         for (const node of u.values(loader.root)) {
//           expect(y.isNode(node)).to.be.false
//           expect(y.isDocument(node)).to.be.false
//           expect(y.isPair(node)).to.be.false
//           expect(y.isAlias(node)).to.be.false
//           expect(u.isObj(node)).to.be.true
//         }
//       })

//       it(`[object] should return the parsed appConfigUrl`, async () => {
//         const loader = new Loader({ config: 'meetd2', dataType: 'object' })
//         await loader.loadRootConfig({
//           ...rootConfig,
//           cadlBaseUrl:
//             'https://public.aitmed.com/cadl/meet3_${cadlVersion}${designSuffix}/',
//         })
//         expect(loader.appConfigUrl).to.eq(
//           `https://public.aitmed.com/cadl/meet3_${rootConfig?.web?.cadlVersion?.test}/${loader.appKey}.yml`,
//         )
//       })

//       describe(`when loading preload pages`, () => {
//         it(`[object] should load each key of preload object as plain objects when using spread`, async () => {
//           mockAllPageRequests()
//           await loader.init({
//             dir: pathToFixtures,
//             loadPages: false,
//             loadPreloadPages: true,
//             spread: ['BaseCSS'],
//           })
//           const obj = baseCssObject
//           const keys = u.keys(obj)
//           expect(keys).to.have.length.greaterThan(0)
//           keys.forEach((key) => {
//             const value = obj[key]
//             expect(y.isNode(value)).to.be.false
//             expect(y.isDocument(value)).to.be.false
//             expect(y.isPair(value)).to.be.false
//             expect(y.isAlias(value)).to.be.false
//             expect(u.isObj(obj)).to.be.true
//           })
//         })

//         it(`[object] should not spread keys of objects when it is not in "spread"`, async () => {
//           mockAllPageRequests()
//           await loader.init({
//             dir: pathToFixtures,
//             loadPages: false,
//             loadPreloadPages: true,
//             spread: ['BaseCSS'],
//           })
//           for (const [name, obj] of u.entries(
//             u.pick(
//               loader.root,
//               preloadPages.filter((s) => s !== 'BaseCSS'),
//             ),
//           )) {
//             expect(loader.root).to.have.property(name)
//             u.keys(obj).forEach((key) => {
//               if (/global/i.test(key as string)) return
//               expect(loader.root).not.to.have.property(key as any)
//             })
//           }
//         })
//       })

//       describe(`when loading app pages`, () => {
//         it(`[object] should load each page as a plain object`, async () => {
//           mockAllPageRequests()
//           await loader.init({
//             dir: pathToFixtures,
//             loadPages: true,
//             loadPreloadPages: true,
//           })
//           for (const [name, obj] of u.entries(u.pick(loader.root, pages))) {
//             const pageObject = loader.root[name]
//             expect(y.isNode(pageObject)).to.be.false
//             expect(y.isDocument(pageObject)).to.be.false
//             expect(y.isPair(pageObject)).to.be.false
//             expect(y.isAlias(pageObject)).to.be.false
//             expect(u.isObj(obj)).to.be.true
//           }
//         })

//         it(`[object] should be able to retrieve their objects using getInRoot`, async () => {
//           mockAllPageRequests()
//           await loader.init({
//             dir: pathToFixtures,
//             loadPages: true,
//             loadPreloadPages: false,
//           })
//           pages.forEach((page) => {
//             const value = loader.getInRoot(page)
//             expect(value).to.exist
//             expect(value).to.be.an('object')
//           })
//         })
//       })

//       it(`[object] should resolve/return the assetsUrl`, async () => {
//         const loader = new Loader({
//           config: 'meetd2',
//           dataType: 'object',
//         })
//         mockAllPageRequests()
//         expect(loader.assetsUrl).not.to.eq(assetsUrl)
//         await loader.loadRootConfig({ config: 'meetd2', dir: pathToFixtures })
//         expect(loader.assetsUrl).to.eq(assetsUrl)
//       })
//     })

//     xit(`should return the same amount of assets regardless of dataType`, async () => {
//       mockAllPageRequests()

//       let mapAssets = []
//       let objectAssets = []

//       const getAssets = async (dataType: 'map' | 'object') => {
//         let loader = new Loader({
//           config: 'meetd2',
//           dataType,
//         })
//         await loader.init({
//           dir: pathToFixtures,
//           loadPages: true,
//           loadPreloadPages: true,
//         })
//         return loader.extractAssets()
//       }

//       mapAssets.push(...(await getAssets('map')))
//       objectAssets.push(...(await getAssets('object')))

//       expect(mapAssets).to.have.length.greaterThan(0)
//       expect(objectAssets).to.have.length.greaterThan(0)
//       expect(mapAssets).to.have.lengthOf(objectAssets.length)
//     })

//     it(`should return the assets url`, async () => {
//       expect(loader.assetsUrl).not.to.eq(assetsUrl)
//       await init()
//       expect(loader.assetsUrl).to.eq(assetsUrl)
//     })

//     it(`should return the baseUrl`, async () => {
//       expect(loader.baseUrl).not.to.eq(baseUrl)
//       await init()
//       expect(loader.baseUrl).to.eq(baseUrl)
//     })

//     it(`should return the config version (latest)`, async () => {
//       expect(loader.configVersion).to.eq('')
//       await init()
//       expect(loader.configVersion).to.eq('0.7d')
//     })

//     it(`should return the app config url`, async () => {
//       expect(loader.appConfigUrl).to.eq('')
//       await init()
//       expect(loader.configVersion).to.eq('0.7d')
//     })

//     it(`should load all the preload pages by default`, async () => {
//       for (const name of preloadPages) {
//         nock(baseUrl)
//           .get(new RegExp(name as string, 'gi'))
//           .reply(
//             200,
//             `
// 					${name}:
// 						VoidObj: vVoOiIdD
// 						Style:
// 							top: '0'
// 					`,
//           )
//       }
//       await loader.init({ dir: pathToFixtures, loadPages: false })
//       preloadPages.forEach((preloadPage) => {
//         expect(loader.root.get(preloadPage as string)).to.exist
//       })
//     })

//     it(`should load all the pages by default`, async () => {
//       await loader.init({ dir: pathToFixtures, loadPreloadPages: false })
//       const pages = (
//         (loader.root.get('cadlEndpoint') as y.Document).get('page') as y.YAMLSeq
//       ).toJSON()
//       expect(pages).to.have.length.greaterThan(0)
//       pages.forEach((page) => {
//         // @ts-expect-error
//         expect(loader.root.get(page.replace('~/', ''))).to.exist
//       })
//     })
//   })

//   describe(u.italic(`extractAssets`), () => {
//     let remoteBaseUrl = 'https://public.aitmed.com/cadl/meet3_${cadlVersion}/'

//     beforeEach(async () => {
//       nock(`https://public.aitmed.com/config`)
//         .get('/meetd2.yml')
//         .reply(
//           200,
//           y.stringify({
//             ...y.parse(meetd2yml),
//             cadlBaseUrl: remoteBaseUrl,
//           }),
//         )
//       await loader.init({ dir: pathToFixtures })
//     })

//     it(`should extract the assets`, async () => {
//       const assets = await loader.extractAssets()
//       expect(assets).to.have.length.greaterThan(0)
//       for (const asset of assets) {
//         expect(asset).to.have.property('url').to.be.a('string')
//         expect(asset.url.startsWith('http')).to.be.true
//       }
//     })

//     it(`should set isRemote to false when assets is relative to the app's baseUrl`, async () => {
//       const assets = await loader.extractAssets()
//       for (const asset of assets) {
//         if (!asset.raw.startsWith('http')) {
//           expect(asset.isRemote).to.be.false
//         } else {
//           expect(asset.isRemote).to.be.true
//         }
//       }
//     })

//     it(`should set the url to be the remote url if isRemote is false (relative to app's baseUrl)`, async () => {
//       const assets = await loader.extractAssets()
//       for (const asset of assets) {
//         if (!asset.isRemote) {
//           expect(/(127.0.0.1|localhost)/.test(asset.url)).to.be.false
//           expect(/public.aitmed.com/.test(asset.url)).to.be.true
//         }
//       }
//     })
//   })

//   it(`[map] should set values of root properties as yaml nodes`, async () => {
//     await loader.init({ dir: pathToFixtures })
//     for (const node of loader.root.values()) {
//       expect(y.isNode(node) || y.isDocument(node)).to.be.true
//     }
//   })

//   describe(`observers`, () => {
//     beforeEach(() => {
//       nock.cleanAll()
//       nock(`https://${c.defaultConfigHostname}/config`)
//         .get('/meetd2.yml')
//         .reply(200, getRootConfigYml())
//     })

//     describe(c.configKeySet, () => {
//       it(`should pass in the config key`, async () => {
//         const spy = sinon.spy()
//         loader.on(c.configKeySet, spy)
//         await loader.loadRootConfig('meetd2')
//         expect(spy).to.be.calledOnce
//         expect(spy.firstCall.args[0][0]).to.eq('meetd2')
//       })
//     })

//     describe(c.rootConfigIsBeingRetrieved, () => {
//       it(`should pass in the configKey and configUrl`, async () => {
//         const spy = sinon.spy()
//         loader.on(c.rootConfigIsBeingRetrieved, spy)
//         await loader.loadRootConfig('meetd2')
//         expect(spy).to.be.calledOnce
//         expect(spy.args[0][0]).to.be.an('array')
//         expect(spy.args[0][0][0]).to.have.property('configKey', 'meetd2')
//         expect(spy.args[0][0][0]).to.have.property(
//           'configUrl',
//           `https://${c.defaultConfigHostname}/config/meetd2.yml`,
//         )
//       })
//     })

//     describe(c.rootConfigRetrieved, () => {
//       it(`should pass in the rootConfig and the yml`, async () => {})
//     })
//   })
// })
