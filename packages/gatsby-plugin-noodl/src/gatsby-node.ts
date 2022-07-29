/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
import type { cache as sdkCache } from '@aitmed/cadl'
import * as u from '@jsmanifest/utils'
import { ConsumerOptions, NuiComponent, publish } from 'noodl-ui'
import log from 'loglevel'
import fs from 'fs-extra'
import * as nt from 'noodl-types'
import get from 'lodash/get'
import set from 'lodash/set'
import path from 'path'
import { Loader, loadFile, LinkStructure } from 'noodl'
import * as y from 'yaml'
import type {
  CreatePagesArgs,
  CreatePageArgs,
  CreateSchemaCustomizationArgs,
  NodePluginArgs,
  SourceNodesArgs,
} from 'gatsby'
import { getGenerator } from './generator'
import utils, { Metadata } from './utils'
import * as t from './types'

const DEFAULT_CONFIG = 'aitmed'
const DEFAULT_DEVICE_TYPE = 'web'
const DEFAULT_ECOS_ENV = 'stable'
const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_OUTPUT_PATH = 'output'
const DEFAULT_SRC_PATH = './src'
const DEFAULT_TEMPLATE_PATH = path.join(DEFAULT_SRC_PATH, 'templates/page.tsx')
const DEFAULT_VIEWPORT_WIDTH = 1024
const DEFAULT_VIEWPORT_HEIGHT = 768
const NOODL_PAGE_NODE_TYPE = 'NoodlPage'

log.setDefaultLevel(DEFAULT_LOG_LEVEL)

const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']
const { cyan, yellow, red, newline } = u
const { debug, info, warn } = log

let _sdkCache: typeof sdkCache
let _meta = new Metadata()

let _loader: Loader<any, any>

let _appKey = ''
let _assetsUrl = ''
let _baseUrl = ''
let _cacheDir = ''
let _cwd = ''
let _configKey = ''
let _configUrl = ''
let _deviceType = '' as nt.DeviceType
let _loglevel = DEFAULT_LOG_LEVEL
let _ecosEnv = '' as nt.Env
let _startPage = ''
let _viewport = {
  width: DEFAULT_VIEWPORT_WIDTH,
  height: DEFAULT_VIEWPORT_HEIGHT,
}

let _pages = {
  json: {},
  serialized: {},
}

let _paths = {
  output: '',
  src: '',
  template: '',
}

export const paths = _paths

const _savedAssets = [] as string[]
const _loggedAssets = [] as string[]
const _preloadKeys = [] as string[]
const _pageKeys = [] as string[]

let _cacheFiles = {} as t.DumpedMetadata['paths']['cacheFiles']
let _context_ = {} as t.InternalData.Context
let _dump = { paths: {} } as t.DumpedMetadata

let _missingFiles = {
  assets: {},
  pages: {},
} as t.DumpedMetadata['missingFiles']

let resolvedAssetsDir = ''
let resolvedConfigsDir = ''
let resolvedAppConfigFile = ''
let resolvedOutputNamespacedWithConfig = ''

const insertFetchedToMeta = (url: string) => {
  const currentFetchedURLs = _meta.get('fetched') || []
  if (!currentFetchedURLs.includes(url)) {
    currentFetchedURLs.push(url)
    _meta.set('fetched', currentFetchedURLs)
  }
}

const withoutCwd = (s: string | Record<string, any>): any => {
  if (u.isObj(s)) {
    return u
      .entries(s)
      .reduce((acc, [k, v]) => u.assign(acc, { [k]: withoutCwd(v) }), {})
  }
  const str = String(s)
  const indexPkgs = str.indexOf('/packages/')
  if (indexPkgs > -1) return str.substring(indexPkgs)
  return s
}

const getPageRefs = (pageName: string) => _sdkCache?.refs?.[pageName] || {}

/**
 * @param { opts:{ paths?: any } } args
 * @returns { Promise<import('./types').DumpedMetadata> }
 */
export const dumpMetadata = async ({
  paths: pathsProp,
  write = true,
  ...other
}: {
  paths?: string[]
  write?: boolean
} & Record<string, any> = {}) => {
  const metadata = withoutCwd({
    appKey: _appKey,
    assetsUrl: _assetsUrl,
    baseUrl: _baseUrl,
    cacheDir: _cacheDir,
    configKey: _configKey,
    configUrl: _configUrl,
    deviceType: _deviceType,
    ecosEnv: _ecosEnv,
    loglevel: _loglevel,
    startPage: _startPage,
    missingFiles: _missingFiles,
    ...other,
    paths: {
      cacheDir: _cacheDir,
      cacheFiles: _cacheFiles,
      cwd: _cwd,
      output: _paths.output,
      resolvedAssetsDir: resolvedAssetsDir,
      resolvedConfigsDir: resolvedConfigsDir,
      resolvedAppConfigFile: resolvedAppConfigFile,
      resolvedOutputNamespacedWithConfig: resolvedOutputNamespacedWithConfig,
      src: _paths.src,
      template: _paths.template,
      ...pathsProp,
    },
    timestamp: new Date().toLocaleString(),
    viewport: {
      width: _viewport?.width,
      height: _viewport?.height,
    },
  })
  if (write) {
    const filepath = u.unixify(path.join(_paths.output, './metadata.json'))
    log.debug(`Writing to: ${u.yellow(filepath)}`)
    await fs.writeJson(filepath, metadata, { spaces: 2 })
  }
  return metadata
}

export const reset = () => {
  _appKey = ''
  _assetsUrl = ''
  _baseUrl = ''
  _cacheDir = ''
  _cwd = ''
  _configKey = ''
  _configUrl = ''
  _deviceType = '' as nt.DeviceType
  _loglevel = DEFAULT_LOG_LEVEL
  _ecosEnv = '' as nt.Env
  _startPage = ''
  _viewport = { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT }
  _pages = { json: {}, serialized: {} }
  _paths = { output: '', src: '', template: '' }
  _savedAssets.length = 0
  _loggedAssets.length = 0
  _preloadKeys.length = 0
  _pageKeys.length = 0
  _context_ = {}
  _dump = { paths: {} } as any
  _missingFiles = { assets: {}, pages: {} }
  _cacheFiles = {}
  resolvedAssetsDir = ''
  resolvedConfigsDir = ''
  resolvedAppConfigFile = ''
  resolvedOutputNamespacedWithConfig = ''
}

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */
export const onPreInit = (
  _: NodePluginArgs,
  pluginOpts: t.GatsbyNoodlPluginOptions,
) => {
  _.reporter.setVerbose(true)

  newline()

  const loglevel = pluginOpts?.loglevel

  if (
    loglevel &&
    loglevel !== DEFAULT_LOG_LEVEL &&
    LOGLEVELS.includes(loglevel)
  ) {
    log.setLevel(loglevel)
    _dump.loglevel = loglevel
    _meta.set('loglevel', loglevel)
  }

  if (pluginOpts.metadata && pluginOpts.metadata instanceof Metadata) {
    _meta = pluginOpts.metadata
  }

  for (const key of u.keys(_paths)) {
    if (pluginOpts[key]) {
      pluginOpts[key] = u.unixify(pluginOpts[key])
      _dump.paths[key] = u.unixify(_dump.paths[key])
    }
  }
}

export const onPluginInit = async function onPluginInit(
  args: NodePluginArgs,
  pluginOpts = {} as t.GatsbyNoodlPluginOptions,
) {
  _paths.output = pluginOpts.paths?.output || DEFAULT_OUTPUT_PATH
  _paths.src = pluginOpts.paths?.src || DEFAULT_SRC_PATH
  _paths.template = require.resolve(
    pluginOpts.paths?.template || DEFAULT_TEMPLATE_PATH,
  )

  _meta.set('paths', {
    ..._meta.get('paths'),
    output: pluginOpts.paths?.output || DEFAULT_OUTPUT_PATH,
    src: pluginOpts.paths?.src || DEFAULT_SRC_PATH,
    template: require.resolve(
      pluginOpts.paths?.template || DEFAULT_TEMPLATE_PATH,
    ),
  })

  _meta.set('cacheDirectory', args.cache.directory)
  _meta.set('cwd', pluginOpts.cwd || process.cwd())
  _meta.set('configKey', pluginOpts.config || DEFAULT_CONFIG)
  _meta.set(
    'configUrl',
    utils.ensureExt(`${BASE_CONFIG_URL}${_configKey}`, 'yml'),
  )
  _meta.set('deviceType', pluginOpts.deviceType || DEFAULT_DEVICE_TYPE)
  _meta.set('ecosEnv', pluginOpts.ecosEnv || DEFAULT_ECOS_ENV)

  _cacheDir = args.cache.directory
  _cwd = pluginOpts.cwd || process.cwd()
  _configKey = pluginOpts.config || DEFAULT_CONFIG
  _configUrl = utils.ensureExt(`${BASE_CONFIG_URL}${_configKey}`, 'yml')
  _deviceType = pluginOpts.deviceType || DEFAULT_DEVICE_TYPE
  _ecosEnv = pluginOpts.ecosEnv || DEFAULT_ECOS_ENV
  _loglevel = pluginOpts.loglevel || DEFAULT_LOG_LEVEL

  debug(`Current working directory: ${yellow(_cwd)}`)
  debug(`Config key: ${yellow(_configKey)}`)
  debug(`Config url: ${yellow(_configUrl)}`)
  debug(`Device type: ${yellow(_deviceType)}`)
  debug(`Ecos environment: ${yellow(_ecosEnv)}`)
  debug(`Log level set to: ${yellow(_loglevel)}`)
  debug(`Template path: ${yellow(_paths.template)}`)

  _meta.set('paths', {
    ..._meta.get('paths'),
    app: {
      assetsDir: u.unixify(
        path.join(resolvedOutputNamespacedWithConfig, 'assets'),
      ),
      config: u.unixify(
        path.join(
          resolvedOutputNamespacedWithConfig,
          utils.ensureExt(_configKey, 'yml'),
        ),
      ),
      dir: u.unixify(utils.getConfigDir(_configKey)),
    },
  })

  resolvedOutputNamespacedWithConfig = u.unixify(utils.getConfigDir(_configKey))
  resolvedAssetsDir = u.unixify(
    path.join(resolvedOutputNamespacedWithConfig, 'assets'),
  )
  resolvedConfigsDir = u.unixify(
    path.join(
      resolvedOutputNamespacedWithConfig,
      utils.ensureExt(_configKey, 'yml'),
    ),
  )

  debug(
    `Resolved outputNamespacedWithConfig: ${yellow(
      resolvedOutputNamespacedWithConfig,
    )}`,
  )
  debug(`Resolved assetsDir: ${yellow(resolvedAssetsDir)}`)
  debug(`Resolved configFile: ${yellow(resolvedConfigsDir)}`)

  if (pluginOpts.paths?.output) {
    if (!fs.existsSync(_paths.output)) {
      await fs.ensureDir(_paths.output)
      debug(`Created output directory at ${yellow(_paths.output)}`)
    } else {
      debug(`Output path: ${yellow(_paths.output)}`)
    }

    debug(
      `Yaml files will be located at ${yellow(
        resolvedOutputNamespacedWithConfig,
      )}`,
    )
  }

  if (!fs.existsSync(resolvedAssetsDir)) {
    await fs.ensureDir(resolvedAssetsDir)
    debug(`Created assets directory`)
  }

  debug(`Assets will be located at ${yellow(resolvedAssetsDir)}`)

  if (!fs.existsSync(resolvedConfigsDir)) {
    const url = utils.getConfigUrl(_configKey)

    info(
      `You are missing the config file ${yellow(
        utils.ensureExt(_configKey),
      )}. It will be downloaded to ${resolvedConfigsDir}`,
    )

    debug(`Fetching config from ${yellow(url)}`)

    const yml = await utils.fetchYml(url)
    await fs.writeFile(resolvedConfigsDir, yml)
    insertFetchedToMeta(url)
  }

  const rootConfig = y.parse(await fs.readFile(resolvedConfigsDir, 'utf8'))

  _appKey = rootConfig?.cadlMain || ''
  _meta.set('appKey', rootConfig?.cadlMain || '')

  if (!rootConfig) {
    throw new Error(`Could not load a config file both locally and remotely`)
  }

  resolvedAppConfigFile = u.unixify(
    path.join(resolvedOutputNamespacedWithConfig, _appKey),
  )

  _meta.set('paths', {
    ..._meta.get('paths'),
    app: {
      ..._meta.get('paths')?.app,
      cadlEndpoint: resolvedAppConfigFile,
    },
  })

  const loaderSettings = {
    appConfigUrl: '',
    options: {
      config: _configKey,
      dataType: 'object',
      deviceType: _deviceType,
      // TODO - This option is not working
      env: _ecosEnv,
      loglevel: (_loglevel as any) || 'verbose',
      version: pluginOpts.version || 'latest',
    } as const,
    loadRootConfigOptions: {
      dir: resolvedOutputNamespacedWithConfig,
      config: _configKey,
    },
    loadAppConfigOptions: {
      dir: '',
      fallback: {
        type: '',
        appConfigUrl: '',
        appDir: '',
        filename: '',
      },
    },
  }

  _loader = new Loader(loaderSettings.options)
  _loader.env = _ecosEnv

  _meta.set('loader', loaderSettings)

  await _loader.loadRootConfig(loaderSettings.loadRootConfigOptions)

  loaderSettings.appConfigUrl = _loader.appConfigUrl

  debug(
    `Loaded root config. Loading app config using key: ${yellow(
      _appKey,
    )} at ${yellow(_loader.appConfigUrl)}`,
  )

  const appConfigYml = await utils.fetchYml(_loader.appConfigUrl)
  _pages.json[_appKey] = y.parse(appConfigYml)
  insertFetchedToMeta(_loader.appConfigUrl)

  if (!fs.existsSync(resolvedAppConfigFile)) {
    await fs.writeFile(resolvedAppConfigFile, appConfigYml, 'utf8')
    debug(`Saved app config to ${yellow(resolvedAppConfigFile)}`)
  }

  for (const key of ['preload', 'page']) {
    const _path_ = `${_appKey}.${key}`
    if (!u.isArr(_pages.json[_appKey]?.[key])) {
      set(_pages.json, _path_, [])
    }
    const keysList = key === 'preload' ? _preloadKeys : _pageKeys
    keysList.push(...get(_pages.json, _path_, []))
  }

  const appConfigUrl = _loader.appConfigUrl
  const filesDir = resolvedOutputNamespacedWithConfig

  // TODO - Check if we still need this part
  for (const filepath of [resolvedConfigsDir, resolvedAppConfigFile]) {
    const type = filepath === resolvedConfigsDir ? 'root' : 'app'
    if (!fs.existsSync(filepath)) {
      const msg = `The ${u.magenta(type)} config file at ${yellow(
        filepath,
      )} does not exist`
      log.error(msg)
      process.exit(0)
    }
  }

  if (!_loader.hasInRoot(_appKey)) {
    const filename = utils.ensureExt(_appKey, 'yml')
    await _loader.loadAppConfig({
      dir: filesDir,
      // eslint-disable-next-line
      fallback: () =>
        utils.downloadFile(
          log as any,
          appConfigUrl,
          filename,
          resolvedOutputNamespacedWithConfig,
        ),
    })
    loaderSettings.loadAppConfigOptions.dir = filesDir
    loaderSettings.loadAppConfigOptions.fallback = {
      type: 'download',
      appConfigUrl,
      appDir: resolvedOutputNamespacedWithConfig,
      filename,
    }
  }

  debug(`Checking directory for page files`)

  const getPageUrl = (s: string) =>
    _loader.appConfigUrl.replace(
      'cadlEndpoint.yml',
      utils.ensureExt(s.includes('_en') ? s.concat('_en') : s, 'yml'),
    )

  const regexStr = `(${_preloadKeys.concat(_pageKeys).join('|')})`
  const filesList = await fs.readdir(filesDir)
  const expectedFilesRegex = new RegExp(regexStr)

  debug(`Constructed regular expression: ${yellow(regexStr)}`)

  _meta.set('existingFilesInAppDirectory', filesList)

  for (const filename of filesList) {
    const name = utils.removeExt(filename, 'yml')
    const filepath = path.join(filesDir, filename)

    try {
      const stat = await fs.stat(filepath)

      if (stat.isFile()) {
        if (filename.endsWith('.yml')) {
          if (expectedFilesRegex.test(name)) {
            // Exists
          } else {
            const pageUrl = getPageUrl(name)
            debug(`Downloading missing page ${yellow(pageUrl)}`)
            await utils.downloadFile(log as any, pageUrl, filename, filesDir)
            insertFetchedToMeta(pageUrl)
          }

          const pageYml = loadFile(filepath)
          const pageObject = y.parse(pageYml)
          _pages.json[name] = pageObject
          debug(`Loaded ${yellow(name)}`)
        }
      } else if (stat.isDirectory()) {
        if (/assets/i.test(filename)) {
          // debug(`Checking assets...`)
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(
        `Error occurring loading ${yellow(filepath)}: ${red(err.message)}`,
        err.stack,
      )
    }
  }

  const loadTo_pages_ = (name: string, obj: Record<string, any>) => {
    _pages.json[name] = obj
    _loader.setInRoot(name, obj)
  }

  /** @type { { pageName: string; filename: string; filepath: string }[] } */

  const appKey = utils.removeExt(rootConfig.cadlMain, 'yml')
  const allYmlPageNames =
    _loader.root[appKey]?.preload?.concat?.(_loader.root[appKey]?.page) || []

  allYmlPageNames.forEach((name: string) => {
    const filename = `${name}_en.yml`
    // const filename = `${name}.yml`
    const filepath = path.join(resolvedOutputNamespacedWithConfig, filename)
    if (!fs.existsSync(filepath)) {
      _missingFiles.pages[name] = { filename, filepath, name }
    } else {
      loadTo_pages_(name, loadFile(filepath, 'json'))
    }
  })

  const baseUrl = _loader.appConfigUrl.replace('cadlEndpoint.yml', '')
  const missingPageNames = u.keys(_missingFiles.pages)

  debug(`Downloading ${yellow(missingPageNames.length)} missing pages...`)
  debug(`Using this endpoint for missing files: ${yellow(baseUrl)}`)

  await Promise.all(
    missingPageNames.map((name: string): Promise<void> => {
      return new Promise((resolve) => {
        const { filename = '' } = _missingFiles.pages[name] || {}
        const url = `${baseUrl}${filename}`
        if (nt.Identify.reference(filename)) return
        if (filename.startsWith('itemObject')) return
        try {
          const destination = path.join(
            resolvedOutputNamespacedWithConfig,
            filename,
          )
          debug(`Downloading ${yellow(filename)} to: ${yellow(destination)}`)
          utils
            .downloadFile(
              log as any,
              url,
              filename,
              resolvedOutputNamespacedWithConfig,
            )
            .then((yml) => {
              loadTo_pages_(name, y.parse(yml))
              insertFetchedToMeta(url)
              resolve()
            })
        } catch (error) {
          debug(error instanceof Error ? error : new Error(String(error)))
          resolve()
        }
      })
    }),
  )

  let assets: LinkStructure[] | undefined

  try {
    assets = await _loader.extractAssets()
    _meta.set('extractedAssets', assets)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(
      `[${yellow(err?.name)}] Error while extracting assets: ${red(
        err.message,
      )}`,
    )
  }

  debug(`Found ${yellow(assets?.length || 0)} assets`)

  // TEMPORARY - This is here to bypass the build failing when using geolocation in lvl3

  if (!global.window) global.window = {} as any
  const win = global.window
  if (!win.document) win.document = { createElement: () => ({}) } as any
  if (!win.location) win.location = { href: 'http://127.0.0.1:3000' } as any
  if (!win.navigator) {
    win.navigator = {
      geolocation: {
        getCurrentPosition: () => ({
          coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 11 },
          timestamp: Date.now(),
        }),
      },
    } as any
  }

  const isAssetSaved = (filepath = '') => _savedAssets.includes(filepath)
  const isAssetLogged = (url = '') => _loggedAssets.includes(url)

  await Promise.all(
    assets?.map(async (asset: Record<string, any>) => {
      const filename = `${asset.raw}`
      const assetFilePath = path.join(resolvedAssetsDir, filename)
      if (fs.existsSync(assetFilePath)) return

      try {
        // TODO - Redo this ugly part
        let fullDir = path.parse(assetFilePath).dir
        if (fullDir.startsWith('https:/') && !fullDir.startsWith('https://')) {
          fullDir = fullDir.replace('https:/', 'https://')
        }

        if (!fs.existsSync(fullDir)) await fs.ensureDir(fullDir)

        let url = `${_loader.appConfigUrl}`.replace('cadlEndpoint.yml', '')
        url += `assets/${filename}`
        _missingFiles.assets[filename] = {
          url,
          filepath: path.join(
            resolvedOutputNamespacedWithConfig,
            `assets/${filename}`,
          ),
        }

        if (!fs.existsSync(assetFilePath)) {
          if (!isAssetLogged(url)) {
            _loggedAssets.push(url)
            info(`Downloading ${yellow(filename)} to ${yellow(assetFilePath)}`)
          }
          await utils.downloadFile(log as any, url, filename, resolvedAssetsDir)
          if (!isAssetSaved(assetFilePath)) {
            _savedAssets.push(assetFilePath)
            insertFetchedToMeta(url)
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if ('response' in err) {
          if (err['response']?.status === 404) {
            const logMsg = `The asset "${asset.url}" `
            warn(logMsg + `returned a ${red(`404 Not Found`)} error`)
          }
        } else {
          debug(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }) || [],
  )
}

export const sourceNodes = async function sourceNodes(
  args: SourceNodesArgs,
  pluginOpts: t.GatsbyNoodlPluginOptions,
) {
  const { cache, actions, createContentDigest, createNodeId } = args
  const { createNode } = actions
  const {
    viewport = {
      width: DEFAULT_VIEWPORT_WIDTH,
      height: DEFAULT_VIEWPORT_HEIGHT,
    },
  } = pluginOpts

  _viewport = viewport

  _meta.set('viewport', u.pick(viewport, ['width', 'height']))

  const {
    cache: sdkCache,
    page,
    pages,
    sdk,
    transform,
  } = await getGenerator({
    configKey: _configKey,
    use: {
      config: _loader?.getInRoot?.(_configKey),
      log: log as any,
      preload: {
        BaseCSS: _loader?.getInRoot?.('BaseCSS'),
        BaseDataModel: _loader?.getInRoot?.('BaseDataModel'),
        BasePage: _loader?.getInRoot?.('BasePage'),
        Resource: _loader?.getInRoot?.('Resource'),
      },
      /**
       * The generator will be mutating this so ensure that this reference will be stay persistent
       */
      pages: _pages,
      viewport,
    },
  })

  _assetsUrl = sdk.assetsUrl
  _baseUrl = sdk.baseUrl
  _sdkCache = sdkCache
  _startPage = (sdk.cadlEndpoint || {}).startPage

  _meta.set('sdk', {
    assetsUrl: sdk.assetsUrl,
    baseUrl: sdk.baseUrl,
    cadlEndpoint: sdk.cadlEndpoint,
  })

  page.viewport.width = viewport.width
  page.viewport.height = viewport.height

  /**
   * Transform parsed json components from lvl3 to Component instances in noodl-ui so the props can be consumed in expected formats in the UI
   * @param { string } pageName
   * @param { nt.ComponentObject[] } componentObjects
   */
  async function generateComponents(
    pageName: string,
    componentObjects: nt.ComponentObject[],
  ) {
    const resolvedPageComponents = [] as NuiComponent.Instance[]

    async function transformAllComponents(
      value: nt.ComponentObject | nt.ComponentObject[],
    ): Promise<NuiComponent.Instance[]> {
      const components = []
      const componentsList = u.filter(Boolean, u.array(value))
      const numComponents = componentsList.length

      for (let index = 0; index < numComponents; index++) {
        let before
        const transformedComponent = await transform(componentsList[index], {
          context: { path: [index] },
          keepVpUnit: true,
          on: {
            /** Called for every component creation (depth-first) */
            async createComponent(
              comp: NuiComponent.Instance,
              opts: ConsumerOptions & { path?: string },
            ) {
              before = u.omit(comp.toJSON(), ['children'])
              const { path: componentPath } = opts || {}
              if (!_context_[pageName]) _context_[pageName] = {}

              if (nt.Identify.component.list(comp)) {
                const iteratorVar = comp.blueprint?.iteratorVar || ''
                const refs = getPageRefs(pageName)
                const currListObjectPath = [pageName, 'components']
                  .concat(componentPath as string)
                  .concat('listObject')
                  .reduce((acc, strOrIndex, i) => {
                    if (
                      u.isNum(Number(strOrIndex)) &&
                      !Number.isNaN(Number(strOrIndex))
                    ) {
                      acc += `[${strOrIndex}]`
                    } else {
                      acc += i === 0 ? strOrIndex : `.${strOrIndex}`
                    }
                    return acc
                  }, '')
                const listObject = comp.get('listObject') || []
                const refObject = u
                  .values(refs)
                  .find((refObj) => refObj.path === currListObjectPath)
                /**
                 * This gets passed to props.pageContext inside NoodlPageTemplate
                 */
                set(_context_, `${pageName}.lists.${comp.id}`, {
                  // Descendant component ids will be inserted here later
                  children: [],
                  componentPath,
                  id: comp.id,
                  iteratorVar,
                  listObject: refObject?.ref || listObject,
                })
              }
              // TODO - Is this still being used?
              else if (nt.Identify.component.image(comp)) {
                // const src = comp.get('path')
                // This is mapped to the client side to pick up the static image
                // comp.set(
                //   '_path_',
                //   nt.Identify.folds.emit(src)
                //     ? await sdk.emitCall(src.emit)
                //     : src,
                // )
              }
            },
          },
        })
        const after = transformedComponent.toJSON()
        resolvedPageComponents.push({ before, after } as any)
        // Serialize the noodl-ui components before they get sent to
        // bootstrap the server-side rendering
        components.push(transformedComponent.toJSON())
      }
      return components
    }

    const transformedComponents = await transformAllComponents(componentObjects)
    if (pageName) info(`${yellow(pageName)} Components generated`)
    return transformedComponents
  }

  const cacheDir = cache.directory

  // const getMetaPathsObject = () =>
  //   (_meta.get('paths') || {}) as Record<string, any>

  // const metaAppPaths = getMetaPathsObject()

  /**
   * Create GraphQL nodes for app pages so they can be queried in the client side
   */
  for (const entry of u.entries(pages)) {
    const [name, pageObject] = entry as [string, Record<string, any>]
    page.page = name

    const pageCacheDir = path.join(cacheDir, 'generated', name)
    const cachedComponentsFilePath = path.join(pageCacheDir, 'components.json')
    const pathToCachedPageContextFile = path.join(pageCacheDir, 'context.json')

    // metaPaths.pageCacheDirectory = pageCacheDir
    // metaPaths.pageComponentsCacheDirectory = cachedComponentsFilePath
    // metaPaths.pageContextFile = pathToCachedPageContextFile

    _cacheFiles[name] = pageCacheDir

    let components
    let retrieveType = ''

    await fs.ensureDir(pageCacheDir)

    const cachedComponents = fs.existsSync(cachedComponentsFilePath)
      ? require(cachedComponentsFilePath)
      : null

    if (cachedComponents) {
      components = cachedComponents
      _context_[name as string] = {
        ..._context_[name as string],
        ...(await fs.readJson(pathToCachedPageContextFile)),
      }
      retrieveType = 'cache'
    } else {
      // cachedObject = {}
      components = u
        .array(
          await generateComponents(
            name,
            (pageObject as nt.PageObject).components,
          ),
        )
        .filter(Boolean)
      await fs.writeJson(cachedComponentsFilePath, components)
      // await fs.writeJson(pathToCachedPageContextFile, _context_[name])
      // await cache.set(_configKey, cachedObject)
      retrieveType = 'fresh'
    }

    if (components) {
      ;(pageObject as nt.PageObject).components = components
    } else {
      log.error(
        `Components could not be generated for page "${name}" using ${retrieveType}`,
      )
    }

    if (!_context_[name]) _context_[name] = {}
    if (_context_[name]) {
      ;(_context_[name] as any).refs = getPageRefs(name) as any
    }

    const lists = _context_[name]?.lists

    // Insert all descendants id's to the list component's children list.
    // This enables the mapping in the client side
    ;(pageObject as nt.PageObject).components.forEach((component) => {
      publish(component as NuiComponent.Instance, (comp) => {
        if (nt.Identify.component.list(comp)) {
          const ctx = lists?.[comp.id] || ({} as t.ListComponentsContext)
          if (!ctx.children) ctx.children = []

          comp.children.forEach((child, index) => {
            if (!ctx.children[index]) ctx.children[index] = []
            if (!ctx.children[index].includes(child.id)) {
              ctx.children[index].push(child.id)
            }
            publish(child, (c) => {
              if (!ctx.children[index].includes(c.id)) {
                ctx.children[index].push(c.id)
              }
            })
          })
        }
      })
    })

    if (retrieveType === 'fresh') {
      await fs.writeJson(pathToCachedPageContextFile, _context_[name])
    }

    _pages.serialized[name] = u.isStr(pageObject)
      ? pageObject
      : JSON.stringify(u.omit(pageObject as nt.PageObject, 'components'))
    _pages.json[name] = pageObject

    /**
     * Create the GraphQL nodes for page objects
     * These will be merged and eventually form the noodl root object that wraps our react app so they can be available to page routes to work with
     */
    await createNode({
      name,
      slug: `/${name}/`,
      id: createNodeId(name),
      content: _pages.serialized[name],
      children: [],
      parent: null,
      internal: {
        content: _pages.serialized[name],
        contentDigest: createContentDigest(_pages.serialized[name]),
        type: NOODL_PAGE_NODE_TYPE,
      },
    })
  }

  // @ts-expect-error
  if (pluginOpts.introspection) {
    await fs.writeJson(
      path.join(_paths.output, `./${_configKey}_introspection.json`),
      pages,
      { spaces: 2 },
    )
  }
  if (pluginOpts.metadata) {
    await dumpMetadata()
  }
}

export const createPages = async function (
  args: CreatePagesArgs,
  pluginOpts: t.GatsbyNoodlPluginOptions,
) {
  try {
    const { actions, graphql } = args
    const { createPage } = actions

    /**
     * Query the created GraphQL nodes from app pages
     */
    const { data: { allNoodlPage } = {}, errors } = await graphql<{
      allNoodlPage: {
        nodes: {
          name: string
          content: string
        }[]
      }
    }>(`
      {
        allNoodlPage {
          nodes {
            name
            content
          }
        }
      }
    `)

    if (errors) {
      throw new Error(errors)
    } else {
      const numNoodlPages = allNoodlPage?.nodes.length || 0
      info(`Creating ${numNoodlPages} pages`)
      /**
       * Creates the page route
       *
       * "context" will be available in the NoodlPageTemplate component as props.pageContext (to ensure we only have the data we care about, we only pick "components" from the page object only.
       *
       * The rest of the page object props (init, etc) are located into the root noodl object instead)
       */
      for (const pageName of u.keys(_pages.json)) {
        // Becomes the page route
        const slug = `/${pageName}/index.html`
        createPage({
          path: slug,
          // NoodlPageTemplate
          component: _paths.template,
          context: {
            assetsUrl: _assetsUrl,
            baseUrl: _baseUrl,
            lists: _context_?.[pageName]?.lists,
            refs: getPageRefs(pageName) || {},
            name: pageName,
            // Intentionally leaving out other props from the page object since they are provided in the root object (available in the React context that wraps our app)
            components:
              _pages.json?.[pageName]?.['components'] ||
              _pages.json?.[pageName]?.['components']?.['components'] ||
              [],
            slug,
          },
        })
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(
      `[Error-createPages][${yellow(err?.name)}] ${red(err.message)}`,
      err.stack,
    )
  }
}

export async function onCreatePage(opts: CreatePageArgs) {
  const { actions, page } = opts
  const { createPage, deletePage } = actions

  // Binds homepage to startPage
  if (page.path === '/') {
    const oldPage = u.assign({}, page)
    const pageName = _startPage
    const slug = `/${pageName}/index.html`
    page.context = {
      assetsUrl: _assetsUrl,
      baseUrl: _baseUrl,
      lists: (get(_context_, pageName) || {})?.lists,
      refs: getPageRefs(pageName) || {},
      name: pageName,
      components:
        _pages.json?.[pageName]?.components ||
        _pages.json?.[pageName]?.components?.components ||
        [],
      slug,
    }
    info(`Home route '${cyan('/')}' is bound to ${yellow(pageName)}`)
    deletePage(oldPage)
    createPage(page)
  }
}

// export const onCreateWebpackConfig = ({
//   actions,
//   stage,
// }: CreateWebpackConfigArgs) => {
//   actions.setWebpackConfig({
//     plugins: [
//       new IgnorePlugin({
//         contextRegExp: /canvas|pnpapi|jsdom$/,
//         resourceRegExp: /canvas|pnpapi|jsdom$/,
//       }),
//     ],
//   })
// }

export const createSchemaCustomization = ({
  actions,
  schema,
}: CreateSchemaCustomizationArgs) => {
  const { createTypes } = actions
  createTypes([
    schema.buildObjectType({
      name: 'NoodlPage',
      fields: {
        name: 'String',
        content: 'String',
        slug: 'String',
      },
      interfaces: ['Node'],
    }),
  ])
}

process.on('uncaughtException', (error, origin) => {
  log.error(
    `[${u.cyan(
      `gatsby-plugin-noodl`,
    )}] Uncaught exception error occurred in origin ${u.yellow(origin)}:`,
  )
  log.error(
    `[${u.cyan(`gatsby-plugin-noodl`)}] ${u.yellow(error.name)}: ${u.red(
      error.message,
    )}`,
  )
  process.stdout.write(JSON.stringify({ error, origin }))
})

process.on('exit', (code) => {
  // dumpMetadata()
  if (code != 0) {
    log.error(
      `[${u.cyan(`gatsby-plugin-noodl`)}] exited with code: ${u.yellow(code)}`,
    )
  }
})
