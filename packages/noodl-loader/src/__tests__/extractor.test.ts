import { fp, is as coreIs } from 'noodl-core'
import { expect } from 'chai'
import NoodlLoader from '../loader'
import { toDocument } from '../utils/yml'
import { createExtractor } from '../extractor'
import * as c from '../constants'

describe(`createExtractor`, () => {
  describe(`when extracting assets`, () => {
    let loader: NoodlLoader
    let yml = ''

    const getOptions = (
      opts: Partial<
        Parameters<ReturnType<typeof createExtractor>['extract']>[1]
      >,
    ) => ({
      ...fp.pick(loader, ['config', 'cadlEndpoint', 'root']),
      ...opts,
    })

    beforeEach(() => {
      loader = new NoodlLoader()
      loader.config.set(
        'cadlBaseUrl',
        'https://public.aitmed.com/cadl/www6.47/',
      )
      yml = `
      SignIn:
        components:
          - type: view
            children:
              - type: image
                path: abc.png
              - type: plugin
                path: main.js
              - type: video
                path: AiTmedMov1.mp4
              - type: image
                path: https://public.aitmed.com/cadl/www6.47/assets/green.svg
              - type: video
                path: https://public.aitmed.com/cadl/www6.47/assets/myMovie.avi
              - type: video
                path: https://public.aitmed.com/cadl/www6.47/assets/myMovie.jpeg
              - type: scrollView
                children:
                  - type: image
                    path: public.gif
                  - type: page
                    path: Dashboard
                  - type: page
                    path: https://public.aitmed.com/cadl/www6.47/assets/Covid.yml
                  - type: view
                    children:
                      - type: image
                        path: colors.jpeg
                  - type: image
                    path: colors.jpeg
              - type: page
                path: https://abc.com/bob.pdf
      `
    })

    it(`should extract all image assets using the "images" preset`, async () => {
      const { extract } = createExtractor()
      const results = await extract(
        toDocument(yml),
        getOptions({
          as: 'object',
          include: 'images',
        }),
      )
      expect(results).to.have.property('abc.png')
      expect(results).to.have.property('public.gif')
      expect(results).to.have.property('colors.jpeg')
      expect(results).to.have.property(
        'https://public.aitmed.com/cadl/www6.47/assets/green.svg',
      )
      expect(Object.keys(results)).to.have.lengthOf(4)
    })

    it(`should set the full url on props.url`, async () => {
      const assetsUrl = `https://public.aitmed.com/cadl/www6.47/assets/`
      loader.cadlEndpoint.baseUrl = 'https://public.aitmed.com/cadl/www6.47/'
      loader.cadlEndpoint.set('assetsUrl', '${cadlBaseUrl}assets/')
      const { extract } = createExtractor()
      const results = await extract(
        toDocument(yml),
        getOptions({ as: 'object', include: 'images' }),
      )
      expect(results)
        .to.have.property('abc.png')
        .to.have.property('props')
        .to.have.property('url')
        .to.eq(`${assetsUrl}abc.png`)
      expect(results['public.gif'].props.url).to.eq(assetsUrl + 'public.gif')
      expect(results['colors.jpeg'].props.url).to.eq(assetsUrl + 'colors.jpeg')
      expect(results)
        .to.have.property(`${assetsUrl}green.svg`)
        .to.have.property('props')
        .to.have.property('url')
        .to.eq(`${assetsUrl}green.svg`)
    })

    it(`should extract all pdf and json assets`, async () => {
      const { extract } = createExtractor()
      const results = await extract(
        toDocument(yml),
        getOptions({ as: 'object', include: 'documents' }),
      )
      expect(results)
        .to.have.property('https://abc.com/bob.pdf')
        .to.have.property('type', c.ExtractType.Asset)
    })

    it(`should extract all script assets`, async () => {
      const { extract } = createExtractor()
      const results = await extract(
        toDocument(yml),
        getOptions({ as: 'object', include: 'scripts' }),
      )
      expect(results)
        .to.have.property('main.js')
        .to.have.property('type', c.ExtractType.Asset)
    })

    it(`should extract all pages`, async () => {
      loader.cadlEndpoint.set('preload', ['BaseCSS'])
      loader.cadlEndpoint.set('page', ['SignIn', 'Dashboard', 'SignUp'])
      const { extract } = createExtractor()
      const results = await extract(
        toDocument(yml),
        getOptions({ as: 'object', include: 'pages' }),
      )
      const filenames = Object.keys(results as Record<string, any>)
      expect(filenames).to.have.lengthOf(3)
      filenames.forEach((filename) => {
        const obj = results[filename]
        expect(obj).to.be.an('object')
        expect(obj).to.have.property('type', c.ExtractType.Page)
        // expect(obj.id).to.exist
      })
    })
  })
})

// describe(`structures`, () => {
//   describe(`FileStructure`, () => {
//     it(`should attach the expected properties`, () => {
//       const fileStructure = new FileStructure()
//       expect(fileStructure.createStructure('')).to.have.all.keys(
//         'name',
//         'raw',
//         'ext',
//         'dir',
//         'filepath',
//         'group',
//         'rootDir',
//       )
//     })

//     const commonNullProps = { dir: null, filepath: null, rootDir: null }

//     const tests = {
//       'hello.mp4': {
//         raw: 'hello.mp4',
//         ext: 'mp4',
//         group: 'video',
//         ...commonNullProps,
//       },
//       hello: {
//         raw: 'hello',
//         ext: null,
//         group: 'unknown',
//         ...commonNullProps,
//       },
//       '.mp4': {
//         raw: '.mp4',
//         ext: 'mp4',
//         group: 'video',
//         ...commonNullProps,
//       },
//       '/Users/christ/aitmed/config/myvideo.avi': {
//         raw: '/Users/christ/aitmed/config/myvideo.avi',
//         ext: 'avi',
//         group: 'video',
//         dir: `/Users/christ/aitmed/config`,
//         filepath: `/Users/christ/aitmed/config/myvideo.avi`,
//         rootDir: `/`,
//       },
//       '/Users/christ/aitmed/config/myvideo': {
//         raw: '/Users/christ/aitmed/config/myvideo',
//         ext: null,
//         group: 'unknown',
//         dir: `/Users/christ/aitmed/config`,
//         filepath: `/Users/christ/aitmed/config/myvideo`,
//         rootDir: `/`,
//       },
//       '/Users/christ/aitmed/config/myvideo/': {
//         raw: '/Users/christ/aitmed/config/myvideo/',
//         ext: null,
//         group: 'unknown',
//         dir: `/Users/christ/aitmed/config`,
//         filepath: `/Users/christ/aitmed/config/myvideo`,
//         rootDir: `/`,
//       },
//       '/Users/christ/aitmed/config/.mp4': {
//         raw: '/Users/christ/aitmed/config/.mp4',
//         ext: 'mp4',
//         group: 'video',
//         dir: `/Users/christ/aitmed/config`,
//         filepath: `/Users/christ/aitmed/config/.mp4`,
//         rootDir: `/`,
//       },
//     }

//     for (const [value, result] of u.entries(tests)) {
//       it(`should attach the expected file structure props for "${value}"`, () => {
//         const fileStructure = new FileStructure()
//         const structure = fileStructure.createStructure(value)
//         u.keys(result).forEach((key) =>
//           expect(structure).to.have.property(key, result[key]),
//         )
//       })
//     }
//   })

//   describe(`LinkStructure`, () => {
//     const tests = {
//       'hello.mp4': {
//         raw: 'hello.mp4',
//         ext: 'mp4',
//         group: 'video',
//         isRemote: false,
//         url: null,
//       },
//       hello: {
//         raw: 'hello',
//         ext: null,
//         group: 'unknown',
//         isRemote: false,
//         url: null,
//       },
//       '.mp4': {
//         raw: '.mp4',
//         ext: 'mp4',
//         group: 'video',
//         isRemote: false,
//         url: null,
//       },
//       '/Users/christ/aitmed/config/myvideo.avi': {
//         raw: '/Users/christ/aitmed/config/myvideo.avi',
//         ext: 'avi',
//         group: 'video',
//         isRemote: false,
//         url: null,
//       },
//       '/Users/christ/aitmed/config/myvideo': {
//         raw: '/Users/christ/aitmed/config/myvideo',
//         ext: null,
//         group: 'unknown',
//         isRemote: false,
//         url: null,
//       },
//       '/Users/christ/aitmed/config/myvideo/': {
//         raw: '/Users/christ/aitmed/config/myvideo/',
//         ext: null,
//         group: 'unknown',
//         isRemote: false,
//         url: null,
//       },
//       '/Users/christ/aitmed/config/.mp4': {
//         raw: '/Users/christ/aitmed/config/.mp4',
//         ext: 'mp4',
//         group: 'video',
//         isRemote: false,
//         url: null,
//       },
//       http: {
//         raw: 'http',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: null,
//       },
//       https: {
//         raw: 'https',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: null,
//       },
//       'https://': {
//         raw: 'https://',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: null,
//       },
//       www: {
//         raw: 'www',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: null,
//       },
//       'https://google.com/': {
//         raw: 'https://google.com/',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: 'https://google.com/',
//       },
//       'https://google.com/bob': {
//         raw: 'https://google.com/bob',
//         ext: null,
//         group: 'unknown',
//         isRemote: true,
//         url: 'https://google.com/bob',
//       },
//       'https://google.com/bob.jpg': {
//         raw: 'https://google.com/bob.jpg',
//         ext: 'jpg',
//         group: 'image',
//         isRemote: true,
//         url: 'https://google.com/bob.jpg',
//       },
//       'https://google.com/bob.png': {
//         raw: 'https://google.com/bob.png',
//         ext: 'png',
//         group: 'image',
//         isRemote: true,
//         url: 'https://google.com/bob.png',
//       },
//       'https://google.com/bob/bob.js': {
//         raw: 'https://google.com/bob/bob.js',
//         ext: 'js',
//         group: 'script',
//         isRemote: true,
//         url: 'https://google.com/bob/bob.js',
//       },
//       'https://google.com/bob/abc.js.html': {
//         raw: 'https://google.com/bob/abc.js.html',
//         ext: 'html',
//         group: 'text',
//         isRemote: true,
//         url: 'https://google.com/bob/abc.js.html',
//       },
//     }

//     for (const [value, result] of u.entries(tests)) {
//       it(`should attach the expected file structure props for "${value}"`, () => {
//         const linkStructure = new LinkStructure()
//         const structure = linkStructure.createStructure(value)
//         u.keys(result).forEach((key) =>
//           expect(structure).to.have.property(key, result[key]),
//         )
//       })
//     }
//   })
// })
