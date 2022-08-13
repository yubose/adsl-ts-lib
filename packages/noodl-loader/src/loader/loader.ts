import * as u from '@jsmanifest/utils'
import inv from 'invariant'
import y, { isPair } from 'yaml'
import fs from 'fs-extra'
import path from 'path'
import { fp, is as coreIs } from 'noodl-core'
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
import FileSystemHost from '../file-system'
import type { As, YAMLNode } from '../types'
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
  #fs: FileSystemHost
  #root: {
    Config: NoodlConfig | null
    Global: Record<string, YAMLNode>
  } & { [key: string]: any }

  config: NoodlConfig
  cadlEndpoint: NoodlCadlEndpoint;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      config: this.config.toJSON(),
      cadlEndpoint: this.cadlEndpoint.toJSON(),
      rootKeys: u.keys(this.#root),
    }
  }

  constructor() {
    super()
    this.#fs = fs as FileSystemHost
    this.#root = {
      Config: new NoodlConfig(),
      Global: {} as Record<string, YAMLNode>,
    }
    this.config = this.#root.Config as NoodlConfig
    this.config.rootConfigUrl = c.baseRemoteConfigUrl
    this.config.set('web', { cadlVersion: { stable: null, test: null } })
    this.cadlEndpoint = new NoodlCadlEndpoint()
    this.#extractor = createExtractor()
  }

  get appKey() {
    return (this.config.appKey || this.config.get('cadlMain') || '') as string
  }

  get configKey() {
    return this.config.configKey
  }

  get fs() {
    return this.#fs
  }

  get root() {
    return this.#root
  }

  extract(
    node: Parameters<ReturnType<typeof createExtractor>['extract']>[0],
    options: Omit<
      Parameters<ReturnType<typeof createExtractor>['extract']>[1],
      'config' | 'cadlEndpoint'
    >,
  ) {
    return this.#extractor.extract(node, {
      ...options,
      config: this.config,
      cadlEndpoint: this.cadlEndpoint,
    })
  }

  getOptions<O extends Record<string, any> = Record<string, any>>(other?: O) {
    return {
      config: this.config,
      cadlEndpoint: this.cadlEndpoint,
      fs: this.fs,
      ...other,
    }
  }

  /**
   * @param value Config, cadlEndpoint, preload name, page name, URL, filepath
   * @param options
   */
  async load(
    value: string,
    options: {
      dir?: string
      mode?: 'url' | 'file'
      overwrite?: boolean
      onCadlEndpointError?: (error: Error) => void
      includePreload?: boolean
      includePages?: boolean
      spread?: boolean
    } = {},
  ) {
    let dir = options?.dir
    let mode = options?.mode || 'url'
    let spread = true

    if (coreIs.bool(options?.spread)) {
      spread = options?.spread as boolean
    }

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

    if (is.equalFileKey(this.configKey, value)) {
      const yml = await getYml({
        ...this.getOptions(),
        dir: options?.dir,
        mode: options?.mode,
        value: create.configUri(value),
      })

      await this.loadConfig(yml, options)
      await this.load(this.appKey, options)

      if (options?.includePreload) {
        await Promise.all(
          this.cadlEndpoint
            .getPreload()
            .map((preload) => this.load(preload, options)),
        )
      }

      if (options?.includePages) {
        await Promise.all(
          this.cadlEndpoint.getPages().map((page) => this.load(page, options)),
        )
      }
    } else if (is.equalFileKey(this.appKey, value)) {
      await this.loadCadlEndpoint(
        await getYml({
          ...this.getOptions(),
          dir: options?.dir,
          mode: options?.mode,
          value: toEndpoint(
            this.config.resolve(this.config.baseUrl) as string,
            value,
          ),
        }),
        options,
      )

      if (options?.includePreload) {
        await Promise.all(
          this.cadlEndpoint
            .getPreload()
            .map((preload) => this.load(preload, options)),
        )
      }

      if (options?.includePages) {
        await Promise.all(
          this.cadlEndpoint.getPages().map((page) => this.load(page, options)),
        )
      }
    } else if (
      this.cadlEndpoint.preloadExists(value) ||
      this.cadlEndpoint.pageExists(value)
    ) {
      const name = value
      const filename = ensureSuffix('.yml', value)
      const endpoint =
        mode === 'file'
          ? path.join(dir || '', filename)
          : toEndpoint(
              this.config.resolve(
                this.cadlEndpoint.baseUrl || this.config.baseUrl,
              ) as string,
              filename,
            )

      await handlePreloadOrPage(
        name,
        await getYml({
          ...this.getOptions(),
          dir,
          mode,
          value: endpoint,
        }),
      )
    } else if (is.url(value)) {
      //
    } else if (is.file(value)) {
      //
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
          value = toEndpoint(this.config.rootConfigUrl, pathname)
        }
        yml = await getYml({ ...this.getOptions(), mode, value })
      }

      const configJson = parseYml('object', yml)

      inv(
        u.isObj(configJson),
        `Expected an object for config but received ${typeOf(configJson)}`,
      )

      u.entries(configJson).forEach(([k, v]) => this.config.set(k, v))
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
      includePreload?: boolean
      includePages?: boolean
      mode?: 'file' | 'url'
    },
  ) {
    let _appKey = ''
    let _baseUrl = this.config.resolve(
      this.cadlEndpoint.baseUrl || this.config.baseUrl,
    ) as string
    let _props = {} as Record<string, any>

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
            const yml = await loadFile(this.fs, filepath)
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

    if (coreIs.obj(_props)) {
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

    // if (_options?.includePreload) {
    //   for (let preload of this.cadlEndpoint?.getPreload() || []) {
    //     preload = ensureSuffix('.yml', preload)

    //     let isLoadFile = _options.mode === 'file'
    //     let yml = ''
    //     let name = trimPageName(preload)

    //     if (isLoadFile) {
    //       inv(
    //         _options.dir,
    //         `Cannot load preload items without a directory provided when mode === 'file'`,
    //       )

    //       const fsys = _options.fs || fs

    //       yml = (await fsys.readFile(
    //         path.join(_options.dir || '', preload),
    //         'utf8',
    //       )) as string
    //     } else {
    //       const url = `${this.cadlEndpoint?.baseUrl}${preload}`
    //       yml = await fetchYml(url)
    //     }

    //     const doc = parseYml('map', yml)

    //     if (y.isMap(doc.contents)) {
    //       spreadToRoot(
    //         (_options?.root || {}) as NoodlLoader['root'],
    //         doc.contents,
    //       )
    //     } else {
    //       set(_options, `root.${name}`, doc)
    //     }
    //   }
    // }

    // if (_options?.includePages) {
    //   inv(
    //     !u.isUnd(_options.root),
    //     `Root object must be provided when loading cadlEndpoint and includePages === true`,
    //   )

    //   for (let page of this.cadlEndpoint?.getPages() || []) {
    //     const name = page
    //     page = ensureSuffix('.yml', page)

    //     let isLoadFile = _options.mode === 'file'
    //     let yml = ''

    //     if (isLoadFile) {
    //       inv(
    //         _options.dir,
    //         `Cannot load pages without a directory provided when mode === 'file'`,
    //       )

    //       const fsys = _options.fs || fs
    //       yml = (await fsys.readFile(
    //         path.join(_options.dir || '', page),
    //         'utf8',
    //       )) as string
    //     } else {
    //       const url = `${this.cadlEndpoint?.baseUrl}${page}`
    //       yml = await fetchYml(url)
    //     }

    //     const doc = parseYml('map', yml)
    //     set(_options, `root.${name}`, doc)
    //   }
    // }
  }

  use(value: FileSystemHost) {
    if (is.fileSystemHost(value)) {
      this.#fs = value
    }
    return this
  }
}

export default NoodlLoader
