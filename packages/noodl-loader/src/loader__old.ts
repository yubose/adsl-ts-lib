// @ts-nocheck
import * as path from 'path'
import * as fs from 'fs-extra'
import * as nu from 'noodl-utils'
import axios, { AxiosRequestConfig } from 'axios'
import { fp, is } from 'noodl-core'
import { ARoot } from 'noodl-core'
import { getLinkStructure } from 'noodl-file'
import type { FileSystem } from 'noodl-file'
import * as chalk from 'chalk'
import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import type { OrArray } from '@jsmanifest/typefest'
import type {
  AppConfig,
  DeviceType,
  Env,
  PageObject,
  RootConfig,
} from 'noodl-types'
import y from 'yaml'
import * as winston from 'winston'
import regex from './internal/regex'
import shallowMerge from './utils/shallowMerge'
import { extractAssetsUrl } from './utils/extract'
import { fetchYml, parse as parseYml, stringify, withYmlExt } from './utils/yml'
import Visitor from './Visitor'
import * as c from './constants'
import * as t from './types'

const { existsSync, readFile } = fs
const { createNoodlPlaceholderReplacer, hasNoodlPlaceholder, isValidAsset } = nu
const { createLogger, format: winstonFormat, transports } = winston
const { red, yellow } = chalk

class NoodlLoader<
  ConfigKey extends string = string,
  DataType extends t.Loader.RootDataType = 'map',
> implements t.ILoader<DataType>
{
  #configKey = ''
  #configVersion = 'latest'
  #remoteBaseUrl = ''
  #fs: FileSystem | undefined
  cbs = {} as Record<string, ((...arguments_: any[]) => any)[]>
  deviceType: DeviceType = 'web'
  dataType: DataType
  env: Env = 'test'
  log: winston.Logger
  options = {
    dataType: 'map' as DataType,
    loglevel: 'error' as t.Loader.Options<ConfigKey, DataType>['loglevel'],
  }

  root: ARoot;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      appKey: this.appKey,
      appConfigUrl: this.appConfigUrl,
      assetsUrl: this.assetsUrl,
      baseUrl: this.baseUrl,
      cbs: this.cbs,
      configKey: this.configKey,
      configVersion: this.configVersion,
      dataType: this.dataType,
      deviceType: this.deviceType,
      env: this.env,
      options: this.options,
      pageNames: this.pageNames,
      totalRootObjects: this.root.size,
    }
  }

  constructor(opts: ConfigKey | t.Loader.Options<ConfigKey, DataType> = {}) {
    this.log = createLogger({
      level: 'error',
      transports: [
        new transports.Console({
          format: winstonFormat.combine(
            winstonFormat.colorize({
              colors: {
                info: 'cyan',
                http: 'grey',
                warn: 'yellow',
                error: 'red',
                debug: 'gray',
              },
            }),
            winstonFormat.simple(),
          ),
        }),
      ],
    })

    const options = is.str(opts) ? { config: opts } : opts
    const configKey = options.config
    const dataType = options.dataType === 'object' ? 'object' : 'map'
    const defaultKeys = ['Global']

    this.configKey = configKey
    this.dataType = dataType as DataType
    this.env = options.env || this.env
    this.options = shallowMerge(this.options, options)
    this.log.level = options.loglevel || this.options.loglevel
    this.log.debug(`Options`, this.options)
    this.log.debug(
      `Instantiating with config: ${this.configKey || '<no config received>'}`,
    )

    this.log.debug(
      `Initiating root with with default keys: ${defaultKeys.join(', ')}`,
    )

    if (dataType === 'object') {
      this.log.debug(
        `Data type set to ${`object`} mode. Root will be a plain object`,
      )
      this.root = {} as t.Loader.Root<DataType>
      defaultKeys.forEach((key) => (this.root[key] = {}))
    } else {
      this.log.debug(`Data type set to ${`map`} mode. Root will be a Map`)
      ;(this.root as Map<any, any>) = new Map()
      defaultKeys.forEach((key) => this.root.set(key, new y.Document()))
      Object.defineProperty(this.root, 'toJSON', {
        value: () => {
          const output = {}
          for (const [name, document_] of this.root as Map<any, any>) {
            y.isDocument(document_) && (output[name] = document_?.toJSON?.())
          }
          return output
        },
      })
    }

    this.log.debug(
      `Initiated root ${
        options.dataType === 'object' ? `as an object` : 'with a map'
      } with default keys: ${
        options.dataType === 'object'
          ? Object.keys(this.root).join(', ')
          : [...this.root.keys()].join(', ')
      }`,
    )
  }

  #fetch = async (url: string, opts?: AxiosRequestConfig) =>
    axios.get(url, opts)

  get fs() {
    return this.#fs as FileSystem
  }

  async init({
    dir = '',
    docOptions,
    fallback,
    loadPages: shouldLoadPages = true,
    loadPreloadPages: shouldLoadPreloadPages = true,
    requestOptions,
    spread,
  }: {
    dir?: string
    docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
    fallback?: {
      appConfig?: Parameters<
        NoodlLoader<ConfigKey, DataType>['loadAppConfig']
      >[0]['fallback']
    }
    loadPages?: boolean
    loadPreloadPages?: boolean
    requestOptions?: AxiosRequestConfig
    spread?: string[] | string
  } = {}) {
    if (!this.configKey) {
      throw new Error(
        `Cannot initiate the aggregator without setting a config key first`,
      )
    }

    this.log.info(`Using app key ${this.appKey}`)
    this.log.info(`Using device type ${this.deviceType}`)
    this.log.info(`Using eCOS environment: ${this.env}`)

    const result = [
      await this.loadRootConfig({ dir, docOptions, requestOptions }),
      await this.loadAppConfig({
        dir,
        docOptions,
        fallback: fallback?.appConfig,
        requestOptions,
      }),
    ] as unknown

    shouldLoadPreloadPages &&
      (await this.loadPreloadPages({ dir, docOptions, requestOptions, spread }))
    shouldLoadPages &&
      (await this.loadPages({ dir, docOptions, requestOptions, spread }))

    return result as DataType extends 'map'
      ? [y.Document<RootConfig>, y.Document<AppConfig>]
      : [RootConfig, AppConfig]
  }

  #getRemoteConfigUrl = () => {
    return `https://${c.defaultConfigHostname}/config/${withYmlExt(
      this.configKey,
    )}`
  }

  #toRootPageKey = (filepath: string, extension = '.yml') =>
    path
      .basename(
        filepath,
        extension.startsWith('.') ? extension : `.${extension}`,
      )
      .replace(/(_en|~\/)/gi, '')

  #getRootConfig = () =>
    (this.getInRoot(this.configKey) ||
      this.getInRoot(
        this.fs.ensureExt(this.configKey, 'yml'),
      )) as DataType extends 'map' ? y.Document.Parsed : RootConfig

  #replaceNoodlPlaceholders = (str = '') => {
    return createNoodlPlaceholderReplacer({
      cadlBaseUrl:
        this.getIn(this.#getRootConfig(), 'cadlBaseUrl') ||
        this.getIn(this.#getRootConfig(), 'baseUrl'),
      cadlVersion: this.configVersion,
      designSuffix: '',
    })(str)
  }

  get appConfigUrl() {
    return this.#replaceNoodlPlaceholders(
      `${this.baseUrl}${this.fs.ensureExt(this.appKey, 'yml')}`,
    )
  }

  get appKey() {
    return (
      (
        (this.getIn(this.#getRootConfig(), 'cadlMain') || '') as string
      )?.replace('.yml', '') || ''
    )
  }

  get assetsUrl() {
    return (
      `${
        this.getIn(this.#getRootConfig(), 'cadlBaseUrl') || ''
      }assets/`.replace(`$\{cadlBaseUrl}`, this.baseUrl) || ''
    )
  }

  get baseUrl() {
    return (this.getIn(this.#getRootConfig(), 'cadlBaseUrl') || '') as string
  }

  get configKey() {
    return this.#configKey
  }

  set configKey(configKey) {
    this.#configKey = configKey
    this.emit(c.configKeySet, configKey)
  }

  get configVersion() {
    if (this.#configVersion === 'latest') {
      return (this.getIn?.(this.#getRootConfig(), [
        this.deviceType,
        'cadlVersion',
        this.env,
      ]) || '') as string
    }
    if (!this.#configVersion) {
      const rootConfig = this.getInRoot(this.configKey)
      if (rootConfig) {
        const path = [this.deviceType, 'cadlVersion', this.env]
        if (this.dataType === 'map') return rootConfig.getIn(path)
        return get(rootConfig, path)
      }
    }
    return this.#configVersion
  }

  set configVersion(configVersion) {
    this.#configVersion = configVersion
  }

  get remoteBaseUrl() {
    return this.#replaceNoodlPlaceholders(this.#remoteBaseUrl)
  }

  get pageNames() {
    let appConfig = this.getInRoot(this.appKey) as y.Document
    let preloadPages = this.getIn(appConfig, 'preload') || []
    let pages = this.getIn(appConfig, 'page') || []
    if (y.isSeq(preloadPages)) preloadPages = preloadPages.toJSON()
    if (y.isSeq(pages)) pages = pages.toJSON()
    return [...preloadPages, ...pages] as string[]
  }

  emit<Evt extends keyof t.Loader.Hooks>(
    event: Evt,
    arguments_:
      | Parameters<t.Loader.Hooks[Evt]>
      | Parameters<t.Loader.Hooks[Evt]>[0],
  ) {
    // @ts-expect-error
    this.cbs[event]?.forEach?.((fn) => fn(fp.toArr(arguments_)))
  }

  async extractAssets() {
    if (!this.configKey) throw new Error(`No configKey was set`)
    let remoteAssetsUrl = this.assetsUrl

    if (
      regex.localAddress.test(remoteAssetsUrl) ||
      !remoteAssetsUrl.startsWith('http')
    ) {
      // Converts to the remote url
      const rootConfig = await fetchYml(this.#getRemoteConfigUrl())
      remoteAssetsUrl = extractAssetsUrl(rootConfig)
    }

    const assets = [] as ILinkStructure[]
    const visitedAssets = [] as string[]
    const urlCache = [] as string[]

    const addAsset = (assetPath: string) => {
      if (!visitedAssets.includes(assetPath) && isValidAsset(assetPath)) {
        assets.push(
          getLinkStructure(assetPath, {
            prefix: remoteAssetsUrl,
            config: this.configKey,
          }),
        )
      }
    }

    if (this.dataType === 'map') {
      const nodes = this.root?.values?.() || []
      for (let visitee of nodes) {
        y.visit(visitee, {
          Scalar: (_, node) => {
            if (is.str(node.value)) {
              const value = node.value
              if (regex.video.test(value) && !urlCache.includes(value)) {
                urlCache.push(value)
                this.log.debug(`Found asset: ${value}`)
                addAsset(value)
              }
            }
          },
        })
      }
    } else {
      Visitor.createVisitor((key, value) => {
        if (
          is.str(value) &&
          regex.video.test(value) &&
          !urlCache.includes(value)
        ) {
          urlCache.push(value)
          this.log.debug(`Found ${String(key)} asset: ${value}`)
          addAsset(value)
        }
      })(this.root)
    }

    return assets
  }

  getIn(
    obj: Record<string, any> | y.Document | y.Document.Parsed,
    key: string[] | string,
  ) {
    if (y.isDocument(obj)) return obj.getIn(fp.toArr(key))
    return get(obj, key)
  }

  getConfigVersion(document_ = this.getInRoot(this.configKey)): string {
    return this.getIn(document_, [this.deviceType, 'cadlVersion', this.env])
  }

  getPageUrl(pathname: string | undefined) {
    return pathname ? `${this.baseUrl}${pathname}` : ''
  }

  getInRoot(key: string) {
    if (this.root instanceof Map) return this.root.get(key)
    return this.root[key]
  }

  hasInRoot(key: string) {
    if (this.root instanceof Map) return this.root.has(key)
    return key in this.root
  }

  setInRoot(key: string, value: any) {
    if (this.root instanceof Map) this.root.set(key, value)
    this.root[key] = value
  }

  /**
   *  Loads the root config. If a directory is given it will attempt to load from a file path. It will fallback to a fresh remote fetch if all else fails
   * @param { string | undefined } options.dir Directory to load the root config from if loading from a directory
   * @param { string | undefined } options.config Config name to override the current config name if provided
   */
  async loadRootConfig(options: {
    dir: string
    docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
    config?: string
    requestOptions?: AxiosRequestConfig
  }): Promise<DataType extends 'map' ? y.Document : Record<string, any>>

  async loadRootConfig(
    config: Record<string, any> | y.Document,
  ): Promise<DataType extends 'map' ? y.Document : Record<string, any>>

  async loadRootConfig(
    configName?: string,
    configUrl?: string,
    requestOptions?: AxiosRequestConfig,
  ): Promise<DataType extends 'map' ? y.Document : Record<string, any>>

  async loadRootConfig(
    options:
      | Record<string, any>
      | y.Document
      | string
      | {
          dir: string
          docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
          config?: string
          requestOptions?: AxiosRequestConfig
        } = this.configKey,
    customConfigUrl?: string,
    requestOptionsProp?: AxiosRequestConfig,
  ) {
    let configDocument:
      | (DataType extends 'map' ? y.Document : Record<string, any>)
      | undefined
    let configYml = ''
    let docOptions:
      | (y.DocumentOptions & y.ParseOptions & y.SchemaOptions)
      | undefined
    let requestOptions: AxiosRequestConfig

    if (y.isDocument(options)) {
      configDocument = options as any
      configYml = y.stringify(options, { indent: 2 })
      this.log.debug(
        `Loaded root config with a provided ${
          this.dataType == 'map' ? 'y doc' : 'object'
        }`,
      )
    } else if (is.obj(options)) {
      if (
        'dir' in options ||
        'docOptions' in options ||
        'config' in options ||
        'requestOptions' in options
      ) {
        options?.config && (this.configKey = options.config)
        options?.requestOptions && (requestOptions = options.requestOptions)
        docOptions = options.docOptions
        const dir = options.dir || ''
        const configFilePath = path.join(
          dir,
          this.fs.ensureExt(this.configKey, 'yml'),
        )
        if (existsSync(configFilePath)) {
          this.log.debug(`Loading root config from: ${configFilePath}`)
          configYml = await readFile(configFilePath, 'utf8')
          configDocument = parseYml(this.dataType, configYml, docOptions)
        } else {
          if (!dir) {
            this.log.debug(`Fetching config ${this.configKey} remotely`)
          } else {
            this.log.error(
              `Tried to load root config from ${configFilePath} but the location does not exist`,
            )
          }
        }
      } else {
        this.log.debug(`Loading the root config provided to arguments`)
        configYml = y.stringify(options)
        configDocument = options as any
      }
    } else if (is.str(options)) {
      this.configKey = options
      this.log.debug(`Fetching config ${options} remotely`)
    }

    if (!this.configKey) {
      throw new Error(
        `Cannot retrieve the root config because a config key was not passed in or set`,
      )
    }

    configDocument && !configYml && (configYml = stringify(configDocument))
    configYml &&
      !configDocument &&
      (configDocument = parseYml(this.dataType, configYml, docOptions))
    requestOptionsProp && (requestOptions = requestOptionsProp)

    const configUrl =
      customConfigUrl ||
      `https://${c.defaultConfigHostname}/config/${withYmlExt(this.configKey)}`

    // TODO - Merge this implmenetation (temp. hardcoded here)
    try {
      this.#remoteBaseUrl = get(
        y.parse((await this.#fetch(configUrl))?.data),
        'cadlBaseUrl',
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(err)
    }

    if (!configYml || !configDocument) {
      this.log.info(`Config URL: ${configUrl}`)
      this.emit(c.rootConfigIsBeingRetrieved, {
        configKey: this.configKey,
        configUrl,
      })
      const { data: yml } = await this.#fetch(configUrl, requestOptions)
      this.log.debug(`Received config yml`)
      configDocument = parseYml(this.dataType, yml, docOptions)
      this.log.debug(
        `Saved config in memory as a ${
          this.dataType == 'map' ? 'doc' : 'object'
        }`,
      )
      configYml = yml
    }

    this.setInRoot(this.configKey, configDocument)
    this.log.debug(`Root key ${this.configKey} set`)
    this.emit(c.rootConfigRetrieved, {
      rootConfig: configDocument as DataType extends 'map'
        ? y.Document
        : RootConfig,
      url: configUrl,
      yml: configYml,
    })

    this.configVersion = this.getConfigVersion(configDocument)
    this.log.info(`Config version: ${this.configVersion || '<unknown>'}`)
    this.emit(c.configVersionSet, this.configVersion)

    y.visit(
      this.dataType == 'map'
        ? (configDocument as any)
        : y.parseDocument(y.stringify(configDocument), docOptions),
      {
        Pair: (key, node) => {
          if (y.isScalar(node.key) && node.key.value === 'cadlBaseUrl') {
            this.log.debug(`Encountered base url: ${String(node.value)}`)
            if (
              y.isScalar(node.value) &&
              is.str(node.value) &&
              hasNoodlPlaceholder(node.value)
            ) {
              const before = node.value.value as string
              node.value.value = this.#replaceNoodlPlaceholders(
                node.value.value as string,
              )
              this.log.info(`Setting base url to ${String(node.value.value)}`)
              this.emit(c.placeholderPurged, {
                before,
                after: node.value.value as string,
              })
              return y.visit.SKIP
            }
          }
        },
        Scalar: (key, node) => {
          if (is.str(node.value) && hasNoodlPlaceholder(node.value)) {
            const before = node.value
            node.value = this.#replaceNoodlPlaceholders(node.value)
            this.log.info(
              `Replaced a placeholder from ${before} to ${String(node.value)}`,
            )
            this.emit(c.placeholderPurged, {
              before,
              after: node.value as string,
            })
          }
        },
      },
    )

    return configDocument
  }

  /**
   * Loads the app config. If a directory is passed it will attempt to load the app config from a file path. It will fallback to a fresh remote fetch if all else fails
   * @param { string | undefined } dir Directory to load from if loading from a directory
   * @param { function | undefined } fallback Used as a resolution strategy to load the app config if fetching fails
   * @returns
   */
  async loadAppConfig({
    dir,
    docOptions,
    fallback,
    requestOptions,
  }: {
    dir?: string
    docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
    fallback?: () => Promise<string> | string
    requestOptions?: AxiosRequestConfig
  } = {}) {
    if (!this.getInRoot(this.configKey)) {
      throw new Error(
        'Cannot initiate app config without retrieving the root config',
      )
    }

    // Placeholders should already have been purged by this time
    let appConfigYml = ''
    let appConfigDocument:
      | (DataType extends 'map' ? y.Document : Record<string, any>)
      | undefined
    let yml = ''

    if (dir) {
      const appConfigFilePath = path.resolve(
        path.join(dir, this.fs.ensureExt(this.appKey, 'yml')),
      )
      if (existsSync(appConfigFilePath)) {
        this.log.debug(`Loading app config from: ${appConfigFilePath}`)
        appConfigYml = await readFile(appConfigFilePath, 'utf8')
        this.log.debug(`Retrieved app config yml`)
        appConfigDocument = parseYml(this.dataType, appConfigYml, docOptions)
        this.log.debug(
          `Loaded app config as a y ${
            this.dataType === 'map' ? 'doc' : 'object'
          }`,
        )
      } else {
        this.log.error(
          `Attempted to load the app config (${'cadlEndpoint'}) from ${
            appConfigFilePath || '<App config file path is empty>'
          } but the location does not exist`,
        )
      }
    }

    if (!appConfigYml || !appConfigDocument) {
      this.log.debug(`Retrieving app config remotely`)
      this.emit(c.appConfigIsBeingRetrieved, {
        appKey: this.appKey,
        rootConfig: this.#getRootConfig(),
        url: this.appConfigUrl,
      })
      try {
        yml = (await this.#fetch(this.appConfigUrl, requestOptions)).data
        this.log.info(`Retrieved app config y`)
      } catch (error) {
        this.log.error(
          `[${red('Error')}] ${yellow('loadAppConfig')}: ${
            (error as Error).message
          }. ` +
            `If a fallback loader was provided, it will be used. ` +
            `Otherwise the app config will be undefined`,
          { fallbackProvided: is.fnc(fallback) },
        )
        is.fnc(fallback) && (yml = await fallback())
      }
    }

    appConfigYml = yml || appConfigYml
    appConfigDocument = parseYml(this.dataType, appConfigYml, docOptions)

    this.emit(c.appConfigRetrieved, {
      appKey: this.appKey,
      appConfig: appConfigDocument as DataType extends 'map'
        ? y.Document.Parsed
        : AppConfig,
      rootConfig: this.#getRootConfig(),
      yml: appConfigYml,
      url: this.appConfigUrl,
    })

    if (appConfigYml) {
      this.setInRoot(this.appKey, appConfigDocument)
      this.log.debug(
        `Loaded app config as a y ${
          this.dataType === 'map' ? 'doc' : 'object'
        } on root key: ${this.appKey}`,
      )
    } else {
      this.log.error(`Attempted to load app config but it was empty or invalid`)
    }
    this.emit(c.appConfigParsed, {
      name: this.appKey,
      appConfig: appConfigDocument as DataType extends 'map'
        ? y.Document
        : AppConfig,
    })
    return appConfigDocument
  }

  async loadPage(
    options: DataType extends 'map'
      ? {
          dir: string
          doc?: y.Document
          docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
          name: string
          spread?: OrArray<string>
        }
      : {
          dir: string
          name: string
          object?: Record<string, any>
          spread?: OrArray<string>
        } & { requestOptions?: AxiosRequestConfig },
  ): Promise<
    | (DataType extends 'map'
        ? y.Document<unknown> | y.Node
        : Record<string, any>)
    | undefined
  >

  async loadPage(
    name: string | undefined,
    document_?: y.Document,
    requestOptions?: AxiosRequestConfig,
  ): Promise<y.Document<unknown> | y.Node | undefined>

  async loadPage(
    options:
      | string
      | (DataType extends 'map'
          ? {
              dir: string
              doc?: y.Document
              docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
              name: string
              spread?: OrArray<string>
            }
          : {
              dir: string
              name: string
              object?: Record<string, any>
              spread?: OrArray<string>
            } & { requestOptions?: AxiosRequestConfig })
      | undefined = '',
    documentOrObject?: Record<string, any> | y.Document,
    requestOptionsProp?: AxiosRequestConfig,
  ) {
    let dir = ''
    let docOptions:
      | (y.DocumentOptions & y.ParseOptions & y.SchemaOptions)
      | undefined
    let name = ''
    let requestOptions: AxiosRequestConfig
    let spread = [] as string[]

    if (is.obj(options)) {
      name = options.name
      dir = options.dir
      documentOrObject =
        'doc' in options
          ? // @ts-expect-error
            options.doc
          : 'object' in options
          ? // @ts-expect-error
            options.object
          : undefined
      fp.toArr(options.spread).forEach((s) => s && spread.push(s))
    }

    if (requestOptionsProp) requestOptions = requestOptionsProp
    if (is.obj(options) && 'docOptions' in options) {
      docOptions = options['docOptions']
    }

    try {
      const key = this.#toRootPageKey(name)

      if (dir && existsSync(dir)) {
        let filepath = ''

        for (const filename of [`${key}.yml`, `${key}_en.yml`]) {
          filepath = path.join(dir, filename)

          if (existsSync(filepath)) {
            const pageName = filename.replace(/(_en|\.yml)/i, '')
            const yml = await readFile(filepath, 'utf8')
            if (yml) {
              documentOrObject = parseYml(this.dataType, yml, docOptions)

              // Format from { SignIn : { SignIn: {...} } } to { SignIn: {...} }
              {
                if (this.dataType === 'map') {
                  if (
                    y.isDocument(documentOrObject) &&
                    documentOrObject.has(pageName)
                  ) {
                    documentOrObject.contents = documentOrObject.get(pageName)
                  }
                  if (
                    y.isMap(documentOrObject) &&
                    documentOrObject.has(pageName)
                  ) {
                    documentOrObject
                  }
                } else if (is.obj(documentOrObject)) {
                  if (pageName in documentOrObject) {
                    documentOrObject = documentOrObject[pageName]
                  }
                }

                this.setInRoot(key, documentOrObject)
              }

              this.log.debug(`Saved a node on root key: ${key}`)
              this.emit(c.appPageRetrieved, {
                pageName,
                pageObject: documentOrObject as DataType extends 'map'
                  ? y.Document
                  : PageObject,
                fromDir: true,
              })
              if (!spread.includes(key)) return this.getInRoot(key || '')
            }
            break
          }
        }
      }

      const spreadKeys = (
        keys: OrArray<string>,
        documentOrObject?: DataType extends 'map'
          ? y.Document
          : Record<string, any>,
      ) => {
        this.log.debug(`Spreading keys: ${fp.toArr(keys).join(', ')}`)
        const spreadFunction = (value: Record<string, any> | y.Document) => {
          if (y.isMap(value)) {
            for (const pair of value.items) {
              if (y.isScalar(pair.key)) {
                this.setInRoot(
                  String(pair.key),
                  parseYml(this.dataType, y.stringify(pair.value), docOptions),
                )
              }
            }
          } else if (y.isDocument(value) && y.isMap(value.contents)) {
            for (const pair of value.contents.items) {
              if (y.isScalar(pair.key)) {
                this.setInRoot(
                  String(pair.key),
                  parseYml(this.dataType, y.stringify(pair.value), docOptions),
                )
              }
            }
          } else if (is.obj(value)) {
            for (const [key, val] of Object.entries(value)) {
              if (is.str(val)) {
                this.setInRoot(key, parseYml(this.dataType, val, docOptions))
              } else {
                this.setInRoot(key, val)
              }
            }
          }
        }

        if (documentOrObject) {
          spreadFunction(documentOrObject)
          fp.toArr(keys).forEach((key) => delete this.root[key])
        } else {
          for (const key of fp.toArr(keys)) {
            if (this.hasInRoot(key)) {
              spreadFunction(this.getInRoot(key))
            }
          }
        }
      }

      if (is.str(name)) {
        const pageUrl = `${this.remoteBaseUrl}${`${key}`}_en.yml`
        const { data: yml } = await this.#fetch(pageUrl, requestOptions)
        documentOrObject = parseYml(this.dataType, yml, docOptions)
        if (spread.includes(name)) spreadKeys(name, documentOrObject as any)
        this.setInRoot(key, documentOrObject)
      } else if (name && y.isDocument(documentOrObject)) {
        if (spread.includes(name)) spreadKeys(name, documentOrObject as any)
        this.setInRoot(key, documentOrObject)
      } else {
        this.log.error(
          `Page ${name || '<empty>'} was not loaded because of bad parameters`,
        )
      }

      if (name) {
        this.log.info(`Loaded page ${name}`)
        this.emit(c.appPageRetrieved, {
          pageName: name,
          pageObject: documentOrObject as DataType extends 'map'
            ? y.Document
            : PageObject,
        })
        return this.getInRoot(key || '')
      }
    } catch (error) {
      if (error instanceof Error) {
        if ((error as any).response?.status === 404) {
          this.log.error(
            `[${red(error.name)}]: Could not find page ${name || ''}`,
          )
          this.emit(c.appPageNotFound, {
            appKey: this.appKey,
            pageName: name,
            error,
          })
        } else {
          this.log.error(
            `[${yellow(error.name)}] on page ${name || ''}: ${error.message}`,
          )
        }
        this.emit(c.appPageRetrieveFailed, {
          error,
          pageName: name,
        })
      }
    }
  }

  async loadPreloadPages({
    dir = '',
    docOptions,
    requestOptions,
    spread,
  }: {
    dir?: string
    docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
    requestOptions?: AxiosRequestConfig
    spread?: OrArray<string>
  } = {}) {
    const spreadKeys = fp.toArr(spread)
    const preloadPages = [] as string[]
    const seq = this.getIn(this.getInRoot(this.appKey) as y.Document, 'preload')

    this.log.debug(
      `Loading preload pages in ${
        this.dataType === 'map' ? 'doc' : 'object'
      } format`,
    )

    if (y.isSeq(seq)) {
      for (const node of seq.items) {
        if (y.isScalar(node) && is.str(node.value)) {
          if (!this.hasInRoot(node.value)) {
            let logMessage = `Adding preload page: ${node.value}`
            if (spreadKeys.includes(node.value)) {
              logMessage += ` (its keys ${`will spread`} on root)`
            }
            this.log.debug(logMessage)
            preloadPages.push(node.value)
          } else {
            this.log.warn(`Preload page "${node.value}" already exists`)
          }
        }
      }
    } else if (is.arr(seq)) {
      for (const name of seq) {
        if (is.str(name) && !this.hasInRoot(name)) {
          let logMessage = `Adding preload page: ${name}`
          if (spreadKeys.includes(name)) {
            logMessage += ` (its keys ${`will spread`} on root)`
          }
          this.log.debug(logMessage)
          preloadPages.push(name)
        }
      }
    }

    return Promise.all(
      preloadPages.map(async (page) =>
        this.loadPage({
          name: page,
          dir,
          docOptions,
          requestOptions,
          spread: spreadKeys,
        }),
      ),
    )
  }

  async loadPages({
    chunks = 4,
    dir = '',
    docOptions,
    requestOptions,
    spread,
  }: {
    chunks?: number
    dir?: string
    docOptions?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions
    requestOptions?: AxiosRequestConfig
    spread?: OrArray<string>
  } = {}) {
    const pages = [] as string[]
    const nodes = this.getIn(this.getInRoot(this.appKey), 'page')

    this.log.debug(
      `Loading pages in ${this.dataType === 'map' ? 'doc' : 'object'} format`,
    )

    if (y.isSeq(nodes)) {
      for (const node of nodes.items) {
        if (y.isScalar(node) && is.str(node.value)) {
          !pages.includes(node.value) && pages.push(node.value)
          if (!pages.includes(node.value)) {
            this.log.info(`Loading page: "${node.value}"`)
          }
        }
      }
    } else if (is.arr(nodes)) {
      for (const node of nodes) {
        if (is.str(node)) {
          !pages.includes(node) && pages.push(node)
          if (!pages.includes(node)) {
            this.log.info(`Loading page: "${node}"`)
          }
        }
      }
    }

    const chunkedPages = chunk(pages, chunks)

    this.log.debug(
      `${String(pages.length)} pages are being loaded in ${String(
        chunkedPages.length,
      )} chunks ${'concurrently'}`,
    )

    const allPages = await Promise.all(
      chunkedPages.map(async (chunked) =>
        Promise.all(
          chunked.map(async (c) =>
            this.loadPage({ name: c, dir, docOptions, requestOptions, spread }),
          ),
        ),
      ),
    )

    this.log.info(
      `${String(chunkedPages.length * chunks)} pages in total were loaded`,
    )

    return flatten(allPages)
  }

  on<Event_ extends keyof t.Loader.Hooks>(
    event_: Event_,
    function_: (arguments_: t.Loader.Hooks[Event_]) => void,
  ) {
    !is.arr(this.cbs[event_]) && (this.cbs[event_] = [])
    this.cbs[event_]?.push(function_)
    return this
  }
}

export default NoodlLoader
