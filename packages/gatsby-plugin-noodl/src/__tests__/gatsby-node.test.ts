import { expect } from 'chai'
import * as u from '@jsmanifest/utils'
// import fg from 'fast-glob'
import fs from 'fs-extra'
// import path from 'path'
import sinon from 'sinon'
import appRoot from 'app-root-path'
import mfs from 'mock-fs'
import {
  onPreInit,
  onPluginInit,
  // sourceNodes,
  // createPages,
  // onCreatePage,
  // paths,
  reset,
  // dumpMetadata,
} from '../gatsby-node'
import { Metadata } from '../utils'

// const rootDir = appRoot.toString()
// const cwd = process.cwd()

// function getAllFiles() {
/** @type { string[] } */
// const files = []
// const dirfiles = fs.readdirSync('.')
// for (const filename of dirfiles) {
//
// }
// }

const getMockCache = () => {
  const cache = new Map()
  return {
    get: async (key: string) =>
      key === undefined
        ? [...cache.entries()].reduce(
            (acc, [k, v]) => u.assign(acc, { [k]: v }),
            {},
          )
        : cache.get(key),
    set: async (key: string, value: any) => {
      cache.set(key, value)
    },
  }
}

beforeEach(() => {
  reset()

  mfs(
    {
      node_modules: {
        winston: {
          lib: {
            winston: {
              transports: {
                'console.js': mfs.file({ content: '' }),
              },
            },
          },
        },
      },
      packages: {
        'gatsby-plugin-noodl': {
          src: {
            'gatsby-node.ts': mfs.file({ content: '' }),
            'generator.ts': mfs.file({ content: '' }),
            'index.ts': mfs.file({ content: '' }),
            'monkeyPatchEventListener.ts': mfs.file({ content: '' }),
            'types.ts': mfs.file({ content: '' }),
            'utils.ts': mfs.file({ content: '' }),
          },
          __tests__: {},
          node_modules: {},
          'gatsby-node.js': mfs.file({ content: '' }),
          'package.json': mfs.file({ content: '{}' }),
          'tsconfig.json': mfs.file({ content: '{}' }),
          'types.d.ts': mfs.file({ content: '' }),
          'utils.js': mfs.file({ content: '' }),
        },
      },
      apps: {
        static: {
          src: {
            resources: {
              assets: {
                items: [
                  'a_animation1.png',
                  'a_animation2.png',
                  'a_animation3.png',
                  'abdominal_pain_in_children.png',
                  'aboutRed.svg',
                  'IconAwesomeCheck.png',
                  'zhuanquan.gif',
                ].reduce(
                  (acc, filename) =>
                    u.assign(acc, {
                      [filename]: mfs.file({ content: Buffer.from([]) }),
                    }),
                  {},
                ),
              },
              images: {
                'logo.png': mfs.file({ content: Buffer.from([]) }),
              },
              'favicon.ico': mfs.file({ content: 'favicon data' }),
            },
            static: {
              'BaseCSS.json': mfs.file({ content: '{}' }),
              'logo.png': mfs.file({ content: Buffer.from([]) }),
              'robots.txt': mfs.file({ content: '' }),
            },
            templates: {
              'page.tsx': mfs.file({ content: '' }),
            },
            'theme.ts': mfs.file({ content: '' }),
          },
          [`gatsby-browser.js`]: mfs.file({ content: '' }),
          [`gatsby-config.js`]: mfs.file({ content: '' }),
          [`gatsby-node.js`]: mfs.file({ content: '' }),
          [`gatsby-ssr.js`]: mfs.file({ content: '' }),
          [`package.json`]: mfs.file({ content: '{}' }),
          [`tsconfig.json`]: mfs.file({ content: '{}' }),
        },
      },
    },
    { createCwd: true },
  )
})

afterEach(() => {
  mfs.restore()
})

// const getDumpedMetadata = () => dumpMetadata()

describe.only(`gatsby-node.js`, () => {
  it(``, async () => {
    console.log(`Mock root:`)
    console.log(fs.readdirSync('.'))
    console.log(appRoot.toString())
    console.log(process.cwd())
    console.log(__dirname)
  })

  describe(`onPreInit`, () => {
    it(`should convert back slashes to forward slashes on all provided paths from the user`, () => {
      const pluginOptions = {
        output: 'meetd2',
        src: 'C:\\Users\\Chris\\abc\\drafts',
        template: 'D:/Users\\Chris/drafts',
      }
      // @ts-expect-error
      onPreInit({ reporter: { setVerbose: sinon.spy() } }, pluginOptions)
      expect(pluginOptions.output).to.eq('meetd2')
      expect(pluginOptions.src).to.eq('C:/Users/Chris/abc/drafts')
      expect(pluginOptions.template).to.eq('D:/Users/Chris/drafts')
    })
  })

  describe.only(`onPluginInit`, () => {
    describe(`when processing paths`, () => {
      it(``, async () => {
        const meta = new Metadata()
        const pluginOpts = { metadata: meta }
        console.log(process.cwd())
        // @ts-expect-error
        await onPluginInit({ cache: { directory: '.cache' } }, pluginOpts)
      })
    })

    xit(`should set the cwd`, async () => {})
    xit(`should set the configKey`, async () => {})
    xit(`should set the configUrl`, async () => {})
    xit(`should set the deviceType`, async () => {})
    xit(`should set the ecosEnv`, async () => {})
    xit(`should set the loglevel`, async () => {})
    xit(`should set resolvedOutputNamespacedWithConfig`, async () => {})
    xit(`should set resolvedAssetsDir`, async () => {})
    xit(`should set resolvedConfigsDir`, async () => {})
    xit(`should set the appKey`, async () => {})
    xit(`should set resolvedAppConfigFile`, async () => {})
    xit(`should set the loader`, async () => {})
    xit(`should set the ecos env on the loader`, async () => {})
    xit(`should set the config key on the loader`, async () => {})
    xit(`should set load the root config on the loader from the directory`, async () => {})
    xit(`should save each jsonified preload page in the pages object`, async () => {})
    xit(`should save each jsonified page in the pages object`, async () => {})
    xit(`should create the output dir if it doesn't exist`, async () => {})
    xit(`should create the assets dir if it doesn't exist`, async () => {})
    xit(`should create the config folder in the output dir if it doesn't exist`, async () => {})
    xit(`should save the app config file if it doesn't exist`, async () => {})
    xit(`should load the app config on the loader`, async () => {})
    xit(`should load the app config using the provided fallback function if it couldn't fetch remotely`, async () => {})
    xit(`should download each page yml file to disk if it doesn't exist`, async () => {})
    xit(`should download each asset file to disk if it doesn't exist`, async () => {})
    xit(`should detect missing page files`, async () => {})
    xit(`should detect missing asset files`, async () => {})
    xit(`should download missing page files`, async () => {})
    xit(`should download missing asset files`, async () => {})

    xit(`should set the configKey and configUrl in cache`, async () => {
      const cache = getMockCache()
      await onPluginInit(
        // @ts-expect-error
        { cache },
        {
          config: 'meetd2',
          path: 'C:\\Users\\Chris\\abc\\drafts',
          template: 'D:/Users\\Chris/drafts',
        },
      )
      expect(await cache.get('configKey')).to.eq('meetd2')
      expect(await cache.get('configUrl')).to.eq(
        'https://public.aitmed.com/config/meetd2.yml',
      )
    })
  })

  describe(`sourceNodes`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`createPages`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`onCreatePage`, () => {
    xit(``, () => {
      //
    })
  })
})
