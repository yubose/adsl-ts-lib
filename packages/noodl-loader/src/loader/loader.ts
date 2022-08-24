import type { LiteralUnion } from 'type-fest'
import { fp, is as coreIs } from 'noodl-core'
import inv from 'invariant'
import y, { isPair } from 'yaml'
import path from 'path'
import { createExtractor } from '../extractor'
import loadFile from '../utils/load-file'
import NoodlConfig from '../config'
import NoodlCadlEndpoint from '../cadlendpoint'
import typeOf from '../utils/type-of'
import {
  fetchYml,
  isDocument,
  isMap,
  isNode,
  parse as parseYml,
  parseAs,
  stringify,
} from '../utils/yml'
import * as create from '../utils/create'
import {
  quoteIfEmptyStr,
  ensureSuffix,
  endpoint as toEndpoint,
  removeSuffix,
} from '../utils/format'
import { replacePlaceholders } from '../utils/replace'
import { trimPageName } from '../utils/trim'
import FileSystemHost from '../file-system'
import LoaderFileSystemHost from './loader-file-system'
import type { ExtractOptions } from '../extractor'
import type { YAMLNode } from '../types'
import * as is from '../utils/is'
import * as c from '../constants'
import * as t from './loader-types'

export type LoadConfigOptions = {
  dir?: string
  fs?: FileSystemHost
  mode?: 'file' | 'url'
  onCadlEndpointError?: (error: Error) => void
  root?: Record<string, any>
} & Record<string, any>

export interface GetYmlFnOptions {
  config?: NoodlConfig
  cadlEndpoint?: NoodlCadlEndpoint
  dir?: string
  fs?: FileSystemHost
  mode?: t.LoadType
  value: unknown
}

export async function getYml(options: GetYmlFnOptions): Promise<any> {
  try {
    let _value = ''
    let { config, cadlEndpoint, fs: _fs, mode, value } = options

    if (coreIs.obj(value)) {
      _value = stringify(value)
    } else if (coreIs.str(value)) {
      _value = value
    }

    if (!mode) {
      const isAppKey = is.equalFileKey(config?.appKey || '', _value)
      const isConfigKey = is.equalFileKey(config?.configKey || '', _value)
      const isPreload = cadlEndpoint?.preloadExists(_value)
      const isPage = cadlEndpoint?.pageExists(_value)
      const isUrl = is.url(_value)

      mode = isUrl || isConfigKey || isPreload || isPage ? 'url' : 'file'

      if (isAppKey || isConfigKey || isPreload || isPage) {
        const baseUrl = isConfigKey ? c.baseRemoteConfigUrl : config?.baseUrl
        _value = `${baseUrl}`
      }
    }

    switch (mode) {
      case 'file': {
        inv(is.file, `Cannot retrieve from invalid filepath "${_value}"`)
        return (await _fs?.readFile(_value, 'utf8')) as string
      }
      case 'url': {
        inv(is.url(_value), `"${_value}" must be a valid url`)
        return fetchYml(_value)
      }
      default:
        return _value
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

function spreadToRoot(root: NoodlLoader['root'], node: y.Document | y.YAMLMap) {
  if (y.isDocument(node)) {
    node = node.contents as y.YAMLMap
  }
  if (y.isMap(node)) {
    node.items.forEach((pair) => {
      root[String(pair.key)] = pair.value
    })
  }
  return root
}

class NoodlLoader extends t.AbstractLoader {
  #extractor: ReturnType<typeof createExtractor>
  #state = {
    /**
     * If languageSuffix is set, fetches to cadlMain/preload/pages will have the language code (taken from config) attached between the file name and extension.
     * @example
     * ```js
     * // When the languageSuffix is set to 'en"
     * const endpoint = 'https://public.aitmed.com/cadl/patd0.7d/BaseCSS_en.yml
     * ```
     */
    languageSuffix: '',
  }
  #fs: FileSystemHost
  #root: {
    Config: NoodlConfig | null
    Global: Record<string, YAMLNode>
  } & { [key: string]: any }
  config: NoodlConfig
  cadlEndpoint: NoodlCadlEndpoint;

  [Symbol.iterator](): Iterator<[name: string, node: any], any, any> {
    const entries = fp.entries(this.root).reverse()
    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length as true
          },
        }
      },
    }
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      config: this.config.toJSON(),
      cadlEndpoint: this.cadlEndpoint.toJSON(),
      rootKeys: Object.keys(this.#root),
    }
  }

  constructor() {
    super()
    this.#fs = new LoaderFileSystemHost()
    this.#root = {
      Config: new NoodlConfig(),
      Global: {} as Record<string, YAMLNode>,
    }
    this.config = this.#root.Config as NoodlConfig
    this.config.rootConfigUrl = c.baseRemoteConfigUrl
    this.config.set('web', { cadlVersion: { stable: null, test: null } })
    this.cadlEndpoint = new NoodlCadlEndpoint()
    this.#extractor = createExtractor(this)
  }

  get appKey() {
    return (this.config.appKey || this.config.get('cadlMain') || '') as string
  }

  get configKey() {
    return this.config.configKey
  }

  get root() {
    return this.#root
  }

  createURL(
    arg1: LiteralUnion<'config' | 'cadlEndpoint' | 'page', string>,
    arg2?: string,
  ): string {
    let type = 'page'
    let pathname = ''

    const withLanguageSuffix = (str: string) => {
      str = trimPageName(str)
      const { languageSuffix = '' } = this.getState()
      if (languageSuffix) str += `_${languageSuffix}`
      return ensureSuffix('.yml', str)
    }

    if (['config', 'cadlEndpoint', 'page'].some((s) => arg1 === s)) {
      type = arg1
      if (arg1 === 'config') {
        pathname = ensureSuffix('.yml', this.configKey)
      } else if (arg1 === 'cadlEndpoint') {
        pathname = ensureSuffix('.yml', this.appKey)
      } else {
        pathname = withLanguageSuffix(arg2 as string)
      }
    } else {
      if (is.equalFileKey(this.configKey, arg1)) {
        return this.createURL('config', arg1)
      } else if (is.equalFileKey(this.appKey, arg1)) {
        return this.createURL('cadlEndpoint', arg1)
      } else {
        return this.createURL('page', arg1)
      }
    }

    switch (type) {
      case 'config':
        return `${this.config.rootConfigUrl}/${pathname}`
      case 'cadlEndpoint':
        return `${this.config.resolve(
          this.cadlEndpoint.baseUrl || this.config.baseUrl,
        )}${pathname}`
      default: {
        return `${this.config.resolve(
          this.cadlEndpoint.baseUrl || this.config.baseUrl,
        )}${pathname}`
      }
    }
  }

  extract<As extends 'array' | 'object' = 'object'>(
    node: Parameters<ReturnType<typeof createExtractor>>[0],
    options?: ExtractOptions<As>,
  ) {
    return this.#extractor(node, options)
  }

  reduce(
    callback: (
      acc: any,
      arg: [name: string, node: any],
      index: number,
      root: NoodlLoader['root'],
    ) => any,
    initialValue: any = undefined,
  ) {
    return fp.entries(this.root).reduce((acc, [name, node], index) => {
      return callback(acc, [name, node], index, this.root)
    }, initialValue)
  }

  getLoadOptions<O extends Record<string, any> = Record<string, any>>(
    other?: O,
  ) {
    return {
      config: this.config,
      cadlEndpoint: this.cadlEndpoint,
      fs: this.#fs,
      languageSuffix: this.getState().languageSuffix,
      ...other,
    }
  }

  getState() {
    return this.#state
  }

  /**
   * @param value Config, cadlEndpoint, preload name, page name, URL, filepath
   * @param options
   */
  async load(
    value: string = '',
    options: {
      dir?: string
      mode?: 'url' | 'file'
      includePreload?: boolean
      includePages?: boolean
      spread?: boolean
    } = {},
  ): Promise<void> {
    if (!arguments.length) {
      inv(!!this.configKey, `Cannot load without a configKey`)
      return void (await this.load(this.config.configKey))
    }

    const {
      dir,
      includePreload = true,
      includePages = true,
      mode = 'url',
      spread = true,
    } = options

    if (mode === 'file') {
      inv(!!dir, `Directory is required when mode === 'file'`)
    }

    const handlePreloadOrPage = async (name: string, yml: string) => {
      try {
        const isPreload = this.cadlEndpoint.preloadExists(name)
        const isPage = this.cadlEndpoint.pageExists(name)
        const doc = parseAs('doc', yml)

        if (isPreload) {
          if (spread) spreadToRoot(this.root, doc.contents as any)
          else this.root[removeSuffix('.yml', name)] = doc.contents as any
        } else if (isPage) {
          this.root[name] = doc
        } else {
          throw new Error(
            `"${value}" (name: ${quoteIfEmptyStr(
              name,
            )}) is not an item of preload or page list`,
          )
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }

    const loadPreloadOrPages = (names: string[]) =>
      Promise.all(names.map((name) => this.load(name, options)))

    if (is.equalFileKey(this.configKey, value)) {
      const configYml = await getYml({
        ...this.getLoadOptions(),
        dir,
        mode,
        value:
          mode === 'file'
            ? path.join(dir as string, ensureSuffix('.yml', value))
            : create.configUri(value),
      })

      await this.loadConfig(configYml, options)
      await this.load(this.appKey, options)

      if (includePreload) {
        await loadPreloadOrPages(this.cadlEndpoint.getPreload())
      }

      if (includePages) {
        await loadPreloadOrPages(this.cadlEndpoint.getPages())
      }
    } else if (is.equalFileKey(this.appKey, value)) {
      await this.loadCadlEndpoint(
        await getYml({
          ...this.getLoadOptions(),
          dir,
          mode,
          value:
            mode === 'file'
              ? path.join(dir as string, ensureSuffix('.yml', this.appKey))
              : this.createURL(value),
        }),
        { ...this.getLoadOptions(), dir, mode },
      )
    } else if (
      this.cadlEndpoint.preloadExists(value) ||
      this.cadlEndpoint.pageExists(value)
    ) {
      const name = value
      const filename = ensureSuffix('.yml', value)

      let endpoint =
        mode === 'file'
          ? path.join(dir || '', filename)
          : this.createURL(filename)

      let { languageSuffix = '' } = this.getState()

      if (languageSuffix) languageSuffix = `_${languageSuffix}`
      endpoint = ensureSuffix(
        '.yml',
        ensureSuffix(languageSuffix, trimPageName(endpoint)),
      )

      await handlePreloadOrPage(
        name,
        await getYml({ ...this.getLoadOptions(), dir, mode, value: endpoint }),
      )
    } else if (is.url(value)) {
      const { name } = path.parse(value)
      if (
        [this.configKey, this.appKey].some((key) => is.equalFileKey(key, name))
      ) {
        await this.load(name, options)
      } else {
        await handlePreloadOrPage(name, await fetchYml(value))
      }
    } else if (is.file(value)) {
      await this.load(path.parse(value).name, { ...options, mode: 'file' })
    }
  }

  async loadConfig(
    yml: string,
    { dir = '', mode }: { dir?: string; mode?: t.LoadType } = {},
  ) {
    try {
      inv(Boolean(yml), `yml cannot be empty`)

      if (is.equalFileKey(this.configKey, yml)) {
        let pathname = ensureSuffix('.yml', yml)
        let value = ''

        if (mode === 'file') {
          inv(!!dir, `Directory is required when mode === 'file'`)
          value = path.join(dir, pathname)
        } else {
          if (!mode) mode = 'url'
          value = this.createURL('config', pathname)
        }
        yml = await getYml({ ...this.getLoadOptions(), mode, value })
      }

      const configJson = parseYml('object', yml)

      inv(
        coreIs.obj(configJson),
        `Expected an object for config but received ${typeOf(configJson)}`,
      )

      fp.entries(configJson).forEach(([k, v]) => this.config.set(k, v))
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  async loadCadlEndpoint(
    arg1?:
      | string
      | y.Document<y.Node<any>>
      | (Record<string, any> & { dir?: string })
      | null
      | undefined,
    arg2?: {
      dir?: string
      fs?: FileSystemHost
      mode?: 'file' | 'url'
    },
  ) {
    let _appKey = ''
    let _props = {} as Record<string, any>
    let _baseUrl = this.config.resolve(
      this.cadlEndpoint.baseUrl || this.config.baseUrl,
    ) as string

    if (!arguments.length) {
      _appKey = this.appKey || this.config.get('cadlMain')

      inv(
        !!_appKey,
        `Config must be loaded containing the app key (cadlMain) if no arguments are provided`,
      )

      if (this.appKey !== _appKey || this.config.get('cadlMain') !== _appKey) {
        this.config.set('cadlMain', _appKey)
      }

      const options = {} as GetYmlFnOptions
      options.mode = 'url'
      options.value = toEndpoint(_baseUrl, _appKey)

      fp.assign(_props, parseAs('json', await getYml(options)))
    } else {
      if (coreIs.obj(arg1)) {
        if (isNode(arg1) || isPair(arg1) || isDocument(arg1)) {
          let node: any = arg1

          if (isDocument(node)) node = node.contents
          if (isMap(node)) {
            node.items.forEach((pair) => {
              _props[String(pair.key)] = isNode(pair.value)
                ? pair.value.toJSON()
                : pair.value
            })
          }
        } else {
          let filename = ensureSuffix('.yml', this.appKey)
          let mode = arg1.mode || arg2?.mode || 'url'

          if (mode === 'file') {
            const dir = arg1.dir || arg2?.dir
            inv(
              !!dir,
              `Directory is required when loading cadlEndpoint and mode === 'file'`,
            )

            const filepath = path.join(dir, filename)
            const yml = await loadFile(this.#fs, filepath)
            fp.assign(_props, parseAs('json', yml))
          } else {
            const url = toEndpoint(_baseUrl, filename)
            const yml = await getYml({ mode, value: url })
            fp.assign(_props, parseAs('json', yml))
          }
        }
      } else if (coreIs.str(arg1)) {
        fp.assign(_props, parseAs('json', arg1))
      } else {
        console.error(new Error(`REMINDER: CONTINUE THIS IMPLEMENTATION`))
      }
    }

    for (let [key, val] of fp.entries(_props)) {
      if (key === 'preload') {
        this.cadlEndpoint.getPreload().push(...val)
      } else if (key === 'page' || key === 'pages') {
        this.cadlEndpoint.getPages().push(...val)
      } else {
        const configProps = this.config.toJSON()
        this.cadlEndpoint?.set?.(key, replacePlaceholders(val, configProps))
      }
    }
  }

  setAppKey(appKey: string) {
    this.config.appKey = appKey
    return this
  }

  setConfigKey(configKey: string) {
    this.config.configKey = configKey
    return this
  }

  setFileLanguageSuffix(languageSuffix: string) {
    this.getState().languageSuffix = languageSuffix
    return this
  }

  use(value: FileSystemHost) {
    if (is.fileSystemHost(value)) {
      this.#fs = value
    }
    return this
  }
}

export default NoodlLoader
