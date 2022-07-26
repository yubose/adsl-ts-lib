import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import y from 'yaml'
import sinon from 'sinon'
import { DocRoot } from 'noodl-yaml'
import { toDocument } from '../utils/yml'
import { ExtractImage, ExtractYaml } from '../extractor'
import type Extractor from '../extractor/Extractor'
import { ui } from './test-utils'
import * as t from '../types'

const assetsUrl = `https://public.aitmed.com/cadl/meet/v0.13/assets/`

const getRoot = () => ({
  Cereal: {
    formData: {
      user: {
        firstName: `Bob`,
        nicknames: [`Pizza Guy`, `Tooler`, `Framer`],
        videoUrls: [
          {
            name: 'backpack',
            path: 'backpack.mp4',
            related: ['reindeer.mkv'],
          },
        ],
      },
    },
  },
  Tiger: {
    currentImageName: 'event.gif',
    components: [
      ui.view({
        children: [
          ui.label({ dataKey: `Cereal.formData.user.firstName` }),
          ui.list({
            children: [
              ui.listItem({
                children: [
                  ui.divider(),
                  ui.label(`...currentImageName`),
                  ui.button({ text: 'Get ticket' }),
                ],
              }),
            ],
          }),
          ui.image({ path: 'abc.png' }),
          ui.view({
            children: [
              ui.view({ children: [ui.video({ path: 'movie.mkv' })] }),
            ],
          }),
        ],
      }),
    ],
  },
})

describe(`Extractor`, () => {
  describe(`ExtractImage`, () => {
    let yml = ''

    beforeEach(() => {
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
      `
    })

    it(`should extract all image assets`, async () => {
      const doc = toDocument(yml)
      const extractor = new ExtractImage()
      const results = extractor.extract(doc)
      const resultsObject = results.reduce((acc, result) => {
        acc[result.value] = result
        return acc
      }, {})
      expect(resultsObject).to.have.property('abc.png')
      expect(resultsObject).to.have.property(
        'https://public.aitmed.com/cadl/www6.47/assets/green.svg',
      )
      expect(resultsObject).to.have.property(
        'https://public.aitmed.com/cadl/www6.47/assets/myMovie.jpeg',
      )
      expect(resultsObject).to.have.property('public.gif')
    })

    it.skip(`should extract all script assets`, () => {
      const doc = toDocument(yml)
      const extractor = new ExtractYaml()
      const results = extractor.extract(doc)
      const resultsObject = results.reduce((acc, result) => {
        acc[result.value] = result
        return acc
      }, {})
      expect(resultsObject)
        .to.have.property('Dashboard')
        .to.have.property('type', 'Yaml')
      expect(resultsObject)
        .to.have.property(
          'https://public.aitmed.com/cadl/www6.47/assets/Covid.yml',
        )
        .to.have.property('type', 'Yaml')
    })

    it.skip(`should extract all yaml assets`, () => {
      process.stdout.write('\x1Bc')
      const doc = toDocument(yml)
      y.visit(doc, function (key, node, path) {
        if (y.isScalar(node) && node.value === 'public.gif') {
          console.log(path)
        }
      })
      // const extractor = new ExtractYaml()
      // const results = extractor.extract(doc)
      // const resultsObject = results.reduce((acc, result) => {
      //   acc[result.value] = result
      //   return acc
      // }, {})
      // expect(resultsObject)
      //   .to.have.property('Dashboard')
      //   .to.have.property('type', 'Yaml')
      // expect(resultsObject)
      //   .to.have.property(
      //     'https://public.aitmed.com/cadl/www6.47/assets/Covid.yml',
      //   )
      //   .to.have.property('type', 'Yaml')
    })
  })

  describe.skip(`accumulators`, () => {
    describe(`ObjAccumulator`, () => {
      it(`[init] should reset its value to an empty object`, () => {
        const acc = new ObjAccumulator()
        acc.value = []
        expect(acc.value).to.deep.eq([])
        acc.init()
        expect(acc.value).to.deep.eq({})
      })

      it(`[reduce] should set the name as key and result as its value`, () => {
        const acc = new ObjAccumulator()
        const obj = acc.init()
        acc.reduce(obj, 'hello', 'topo')
        expect(acc.value).to.deep.eq({ hello: 'topo' })
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
